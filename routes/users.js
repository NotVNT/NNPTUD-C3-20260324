var express = require("express");
var router = express.Router();
let userModel = require("../schemas/users");
let roleModel = require("../schemas/roles");
let { validatedResult, CreateAnUserValidator, ModifyAnUserValidator } = require('../utils/validator')
let userController = require('../controllers/users')
let { CheckLogin, checkRole } = require('../utils/authHandler')
let { uploadExcel } = require('../utils/uploadHandler')
let exceljs = require('exceljs')
let path = require('path')
let fs = require('fs')
let crypto = require('crypto')
let { sendWelcomePasswordMail } = require('../utils/sendMail')


router.get("/", CheckLogin, checkRole("ADMIN","MODERATOR"), async function (req, res, next) {//ADMIN
  let users = await userController.GetAllUser()
  res.send(users);
});

router.get("/:id", async function (req, res, next) {
  let result = await userController.GetUserById(
    req.params.id
  )
  if (result) {
    res.send(result);
  } else {
    res.status(404).send({ message: "id not found" })
  }
});

router.post('/import', uploadExcel.single('file'), async function (req, res, next) {
  if (!req.file) {
    return res.status(404).send({
      message: 'file not found'
    })
  }

  let workbook = new exceljs.Workbook();
  let pathFile = path.join(__dirname, '../uploads', req.file.filename)

  try {
    await workbook.xlsx.readFile(pathFile)
    let worksheet = workbook.worksheets[0]
    if (!worksheet) {
      return res.status(400).send({ message: 'file excel khong co du lieu' })
    }

    let userRole = await roleModel.findOne({
      name: new RegExp('^user$', 'i'),
      isDeleted: false
    })

    if (!userRole) {
      return res.status(400).send({ message: 'khong tim thay role user' })
    }

    let results = []
    let existingUsers = await userModel.find({}, { username: 1, email: 1 })
    let usernameSet = new Set(existingUsers.map(u => (u.username || '').toLowerCase()))
    let emailSet = new Set(existingUsers.map(u => (u.email || '').toLowerCase()))

    for (let index = 2; index <= worksheet.rowCount; index++) {
      let row = worksheet.getRow(index)
      let username = row.getCell(1).text ? row.getCell(1).text.trim() : ''
      let email = row.getCell(2).text ? row.getCell(2).text.trim().toLowerCase() : ''
      let errorsInRow = []

      if (!username) {
        errorsInRow.push('username khong duoc de trong')
      }
      if (!email) {
        errorsInRow.push('email khong duoc de trong')
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorsInRow.push('email khong dung dinh dang')
      }
      if (usernameSet.has(username.toLowerCase())) {
        errorsInRow.push('username bi trung')
      }
      if (emailSet.has(email)) {
        errorsInRow.push('email bi trung')
      }

      if (errorsInRow.length > 0) {
        results.push({
          row: index,
          success: false,
          data: errorsInRow
        })
        continue
      }

      let randomPassword = crypto.randomBytes(24)
        .toString('base64')
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 16)

      try {
        let newUser = await userController.CreateAnUser(
          username,
          randomPassword,
          email,
          userRole._id
        )

        await sendWelcomePasswordMail(email, username, randomPassword)

        usernameSet.add(username.toLowerCase())
        emailSet.add(email)

        results.push({
          row: index,
          success: true,
          data: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email
          }
        })
      } catch (error) {
        results.push({
          row: index,
          success: false,
          data: [error.message]
        })
      }
    }

    return res.send(results)
  } catch (error) {
    return res.status(400).send({ message: error.message })
  } finally {
    if (fs.existsSync(pathFile)) {
      fs.unlinkSync(pathFile)
    }
  }
})

router.post("/", CreateAnUserValidator, validatedResult, async function (req, res, next) {
  
  try {
    let user = await userController.CreateAnUser(
      req.body.username, req.body.password,
      req.body.email, req.body.role
    )
    res.send(user);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", ModifyAnUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate
      (id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;