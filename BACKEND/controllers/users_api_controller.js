const fs = require('fs');
const {User, UserException, users} = require('../models/user.js');

//Middleware Auth for users
exports.authUserMiddleware = (req, res, next) => {
    if(req.header("x-auth")){
        let id_user = Number(req.params.id);
        let foundId = users.find(storedUser => storedUser.id === id_user);
        if(foundId){
            if(req.header("x-auth") === foundId.password){
                next();
            }
            else{
                console.log("Contrasena incorrecta")
                res.sendStatus(401);            
            }
        }
        else{
            console.log("Usuario no existe")
            res.sendStatus(404);
        }
    }
    else{
        console.log("No Header");
        res.sendStatus(401);
    }
}

exports.registerUser = (req, res) => {
    try{
        if(req.body.password != req.body.confirm_password){
            return res.status(400).send("Error: Password Missmatch")
        }
        else{
            let user = createUser(req.body.name, req.body.email, req.body.password, req.body.birthday);
            fs.writeFileSync('./database/users.json', JSON.stringify(users, null, 2));
            res.send(user.toObj());
        }
    } catch(error){
        res.status(400).send(error.errorMessage);
    }
}
exports.getUsers = (req,res)=>{
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    let start = (page - 1) * limit;
    let end = start + limit;
    let paginatedUsers = users.slice(start, end)
    if(req.header("x-auth") === "admin_auth"){
            res.json({
                page,
                next_page: end < users.length ? page + 1 : null,
                limit,
                total: users.length,
                data: paginatedUsers
            });
        }
        else{
            res.sendStatus(401);
        }
}

exports.getUserById = (req, res) => {
    let user = innerGetUserById(Number(req.params.id))
    if(!user){
        return res.sendStatus(404);
    }
     res.json(user);
}

exports.patchUser = (req, res) => {
    try{
        let id = Number(req.params.id)
        let new_info = req.body;
        updateUser(id, new_info)
        fs.writeFileSync('./database/users.json', JSON.stringify(users, null, 2));

        let updatedUser = users.find(user => user.id === id)

        res.json({
            message: "User Updated",
            user: updatedUser
        })
    } catch(error){
        res.status(400).send(error.errorMessage || error.message);
    }
}

exports.delete = (req, res) => {
    try{
        let id = Number(req.params.id);
        let target_user = users.find(user => user.id === id);
        deleteUser(id);
        fs.writeFileSync('./database/users.json', JSON.stringify(users, null, 2));

        res.json({
            message:"Usuario con id " + id + " Eliminado",
            user: target_user
        })
    }
    catch(error){
        res.status(400).send(error.errorMessage || error.message);
    }  
}

exports.login = (req, res) => {
    let data = req.body,
        user = users.find(user => (user.email == data.email && user.password == data.password))
    
    if(user){
        res.send(user);
    }
    else{
        res.sendStatus(401)
    }
}
//Inner Functions
function createUser(userName, userMail, userPsswd, userBday){
    let user = new User(userName, userMail, userPsswd, userBday);
    users.push(user.toObj());
    return user;
}

function innerGetUserById(id){
    return users.find(storedUser => storedUser.id === id);
}

function searchUsers(attribute, value){
    let validAttributes = [
        "id",
        "name",
        "email",
        "password",
        "birthday",
        "joined_at"
    ]

    if(!validAttributes.includes(attribute)){
        throw new UserException("Atributo No Existe");
    }

    if(attribute === "joined_at"){
            let searchDate = new Date(value);
            if(isNaN(searchDate.getTime())){
                throw new UserException("Fecha No Valida")
            }
            return users.filter( checkUsers => {
                return(
                    checkUsers.joined_at.getFullYear() === searchDate.getFullYear() &&
                    checkUsers.joined_at.getMonth() === searchDate.getMonth() &&
                    checkUsers.joined_at.getDate() === searchDate.getDate()
                )
            })
        }
    
    if(attribute === "id"){
        let newValue = Number(value);
        return users.filter( checkUsers => {
            return checkUsers.id === newValue;
        })
    }

    return users.filter( checkUsers => {
        return checkUsers[attribute].includes(value);
    })
}

function getAllUsers(){
    let allUsers = users.slice();
    return allUsers;
}

function updateUser(id, obj_new_info){
    let user_mod = users.find(storedUser => storedUser.id === id);
    let validAttributes = [
        "name",
        "email",
        "password",
        "birthday"
    ]
    let successful = false;

    if(!user_mod){
        throw new UserException("ID Usuario No Existe")
    }

    for(let attribute in obj_new_info){
        if(validAttributes.includes(attribute)){
            if(user_mod[attribute] !== obj_new_info[attribute]){
                User.validate(attribute, obj_new_info[attribute], id);
                user_mod[attribute] = obj_new_info[attribute];
                successful = true;
            }
        }
    }
    if(!successful){
        throw new UserException("No se realizaron modificaciones");
    }
    return true;
}

function deleteUser(id){
    let userDelete = users.find(storedUser => storedUser.id === id);
    if(!userDelete){
        throw new UserException("Id Usuario No Existe");
    }

    let indexDelete = users.indexOf(userDelete);
    users.splice(indexDelete,1);
}