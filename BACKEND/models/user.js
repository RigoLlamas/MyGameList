const fs = require('fs')
const path = require('path')
let users = JSON.parse(fs.readFileSync(path.join(__dirname, '../database/users.json')));

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
    #bio;

    constructor(userName, userMail, userPsswd, userBday){
        this.#id = getNextUserId();
        this.name = userName;
        this.email = userMail;
        this.password = userPsswd;
        this.birthday = userBday;
        this.#joined_at = new Date();
        this.#friends = new Array();
        this.#favorites = new Array();
        this.#bio = "";
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

    get friends(){
        return this.#friends;
    }
    set friends(value){
        throw new UserException("Arreglo de amigos se crea en automatico");
    }

    get favorites(){
        return this.#favorites;
    }
    set favorites(value){
        throw new UserException("Arreglo de favoritos se crea en automatico");
    }

    get bio(){
        return this.#bio;
    }
    set bio(value){
        if(typeof value != "string"){
            throw new UserException("Biografia debe ser un string");
        }
        if(value.length > 300){
            throw new UserException("Biografia no puede exceder 300 caracteres");
        }
        this.#bio = value;
    }

    static validate(attribute, value, id){
        if(attribute === "name"){
            if(typeof value != "string"){
                throw new UserException("Nombre de usuario debe ser una cadena de texto");
            }
            if(!value){
                throw new UserException("Nombre de usuario no puede estar vacio");
            }
        }
        if(attribute === "email"){
            if(typeof value != "string"){
                throw new UserException("Email debe ser una cadena de texto");
            }
            if(!value){
                throw new UserException("Email de usuario no puede estar vacio");
            }
            if(users.find(storedUser => storedUser.email === value && storedUser.id !== id)){
                throw new UserException("Email ya esta en uso");
            }
        }
        if(attribute === "password"){
            if(typeof value != "string"){
                throw new UserException("Contrasena debe ser una cadena de texto");
            }
            if(!value){
                throw new UserException("Contrasena no puede estar vacio");
            }
            if(value.length < 8){
                throw new UserException("Contrasena debe tener al menos 8 caracteres");
            }
        }
        if(attribute === "birthday"){
            if(typeof value != "string"){
                throw new UserException("Dia de nacimiento debe ser string");
            }
            if(!value){
                throw new UserException("Dia de nacimiento no puede estar vacio");
            }
            const fecha = new Date(value + "T00:00:00");
            if (isNaN(fecha.getTime())) {
            throw new UserException("Dia de nacimiento no es una fecha valida");
            }
        }
        if(attribute === "bio"){
            if(typeof value != "string"){
                throw new UserException("Biografia debe ser un string")
            }
            if(value.length > 300){
                throw new UserException("Biografia no puede exceder 300 caracteres")
            }
        }
    }

    toObj(){
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            password: this.password,
            birthday: this.birthday,
            joined_at: this.joined_at,
            friends: this.friends,
            favorites: this.favorites,
            bio: this.bio
        };
    }
}

module.exports = {User, UserException, users};