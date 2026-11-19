const fs = require('fs')
let users = JSON.parse(fs.readFileSync('./database/users.json'))

function getNextUserId(){
    if(users.length === 0){
        return 1;
    }
    let last_users_id = users[users.length-1].id;
    return last_users_id + 1;
}

class UserException{
    constructor(errorMessage){
        this.errorMessage = errorMessage;
    }
}

class User{
    #id;
    #name;
    #email;
    #password;
    #birthday;
    #joined_at;
    #friends;
    #favorites;

    constructor(userName, userMail, userPsswd, userBday){
        this.#id = getNextUserId();
        this.name = userName;
        this.email = userMail;
        this.password = userPsswd;
        this.birthday = userBday;
        this.#joined_at = new Date();
        this.#friends = new Array();
        this.#favorites = new Array();
    }
    
    get id(){
        return this.#id;
    }
    set id(value){
        throw new UserException("ID son autogenerados");
    }

    get name(){
        return this.#name;
    }
    set name(userName){
        if(typeof userName != "string"){
            throw new UserException("Nombre de usuario debe ser una cadena de texto");
        }
        if(!userName){
            throw new UserException("Nombre de usuario no puede estar vacio");
        }
        this.#name = userName;
    }

    get email(){
        return this.#email;
    }
    set email(userMail){
        if(typeof userMail != "string"){
            throw new UserException("Email debe ser una cadena de texto");
        }
        if(!userMail){
            throw new UserException("Email de usuario no puede estar vacio");
        }
        if (users.find(storedUser => storedUser.email === userMail)){
            throw new UserException("Email ya esta en uso");
        }
        this.#email = userMail;
    }

    get password(){
        return this.#password;
    }
    set password(userPsswd){
        if(typeof userPsswd != "string"){
            throw new UserException("Contrasena debe ser una cadena de texto");
        }
        if(!userPsswd){
            throw new UserException("Contrasena no puede estar vacio");
        }
        if(userPsswd.length < 8){
            throw new UserException("Contrasena debe tener al menos 8 caracteres");
        }
        if (users.find(storedUser => storedUser.password === userPsswd)) {
            throw new UserException("Contraseña ya está en uso");
        }
        this.#password = userPsswd;
    }

    get birthday(){
        return this.#birthday;
    }
    set birthday(userBday){        
        if(typeof userBday != "string"){
            throw new UserException("Dia de nacimiento no es un string");
        }
        if(!userBday){
            throw new UserException("Dia de nacimiento no puede ser vacio");
        }

        const fecha = new Date(userBday + "T00:00:00");
        if (isNaN(fecha.getTime())) {
            throw new UserException("Dia de nacimiento no es una fecha valida");
        }
        this.#birthday = fecha;
    }

    get joined_at(){
        return this.#joined_at;
    }
    set joined_at(value){
        throw new UserException("Fecha de entrada se asigna en automatico");
    }

    get friend(){
        return this.#friends;
    }
    set friend(value){
        throw new UserException("Arreglo de amigos se crea en automatico");
    }

    get favorites(){
        return this.#favorites;
    }
    set favorites(value){
        throw new UserException("Arreglo de favoritos se crea en automatico");
    }
}

module.exports = {User, UserException, users};