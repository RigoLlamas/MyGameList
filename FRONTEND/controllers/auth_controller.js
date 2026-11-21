//Funciones para mostrar y ocultar lottie//
function showLoading(){
    document.getElementById('loading_overlay').style.display = 'flex';
}
function hideLoading(despues){
    setTimeout(() => {
        document.getElementById('loading_overlay').style.display = 'none'
        if(despues) despues();
    }, 2000);
}
////////////////////////////////////////////
function login(){
    event.preventDefault();
    let data = new FormData(event.target);

    showLoading();
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body: JSON.stringify(Object.fromEntries(data.entries()))
    })
    .then(response => {
        if(!response.ok){
            return response.text().then(msg => { throw new Error(msg || response.status); });
        }
        return response.json()
    })
    .then(user => {
        sessionStorage.setItem('user', JSON.stringify(user));
        hideLoading(()=>{
            window.location.href = local_url + 'views/index.html';
        })
    })
    .catch(err => {
        console.error("Error en Login:", err);
        hideLoading(()=>{
            alert("Error inciando sesion: " + err.message);
        })
    })
}
let formLogin = document.getElementById('formLogin');
if(formLogin) formLogin.addEventListener('submit', login);

function logout(){
    sessionStorage.clear();
    window.location.href = local_url
}

function register(){
    event.preventDefault();
    let data = Object.fromEntries(new FormData(event.target).entries());

    //Validaciones
    if(data.password.length < 8){
        alert("Contrasena no puede se menor a 8 caracteres");
        return;
    }
    if(data.password !== data.confirm_password){
        alert("Contrasenas no son iguales");
        return;
    }
    if(new Date(data.birthday) > new Date()){
        alert("La fecha de nacimiento no puede ser futura")
        return;
    }
    showLoading();
    fetch('/users', {
        method: 'POST',
        headers: {
            'Content-Type':'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if(!response.ok){
            return response.text().then(msg => { throw new Error(msg || response.status); });
        }
        return response.json()
    })
    .then(user => {
        sessionStorage.setItem('user', JSON.stringify(user));
        hideLoading(()=>{
            window.location.href = local_url + 'views/index.html';
        })
    })
    .catch(err => {
        console.error("Error en Registro:", err);
        hideLoading(()=>{
            alert("Error creando cuenta: " + err.message);
        })
    })
}
let formRegister = document.getElementById('formRegister');
if(formRegister) formRegister.addEventListener('submit', register);

function populateModal(){
    let user = JSON.parse(sessionStorage.user);
    document.getElementById('inputUsername').value = user.name;
    document.getElementById('inputBio').value = user.bio || '';
    document.getElementById('inputBirthdate').value = user.birthday.slice(0, 10);
}
let modalEdit = document.getElementById('modalEditarPerfil');
if(modalEdit){
modalEdit.addEventListener('shown.bs.modal', populateModal);

document.getElementById('btnOpenDelete').addEventListener('click', () => {
    bootstrap.Modal.getInstance(modalEdit).hide();
    new bootstrap.Modal(document.getElementById('modal_delete_user')).show();
    });
}

function deleteUser(){
    event.preventDefault();
    let user = JSON.parse(sessionStorage.user);

    fetch('/users/'+user.id, {
        method: 'DELETE',
        headers: { 'x-auth': user.password }
    })
    .then(response => {
        if(!response.ok){
            return response.text().then(msg => { throw new Error(msg || response.status); });
        }
        alert("Eliminacion Exitosa");
        sessionStorage.clear();
        window.location.href = local_url;
    })
    .catch(err => {
        console.error("Error en la Eliminacion: ", err);
        alert("No se pudo eliminar: " + err.message);
    })
}
let button_confirm_user = document.getElementById('button_confirm_delete');
if(button_confirm_user){
    button_confirm_user.addEventListener('click', deleteUser)
}

function patchUser(){
    event.preventDefault();
    let user = JSON.parse(sessionStorage.user);
    let data = Object.fromEntries(new FormData(event.target).entries());
    if(!data.password) delete data.password; //Si viene vacia la conrtasena no la cambies

    fetch('/users/'+user.id, {
        method: 'PATCH',
        headers: {
            'x-auth': user.password,
            'Content-Type':'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if(!response.ok){
            return response.text().then(msg => { throw new Error(msg || response.status); });
        }
        return response.json()
    })
    .then(response => {
        sessionStorage.setItem('user', JSON.stringify(response.user));
        bootstrap.Modal.getInstance(modalEdit).hide();
        init()
        alert("Cambios realizados")
    })
    .catch(err => {
        console.error("Error en la edicion:", err);
        alert("No se pudo actualizar: " + err.message);    })
}
let formEditProfile = document.getElementById('formEditProfile');
if(formEditProfile){
    formEditProfile.addEventListener('submit', patchUser)
}

function init(){
    if(!sessionStorage.user) return;
    const user = JSON.parse(sessionStorage.user);

    if(page === "profile.html"){
        document.getElementById('user_name').textContent = user.name;
        document.getElementById('user_joined_at').innerHTML = 
            new Date(user.joined_at).toLocaleDateString('es-MX', {month: 'short', year: 'numeric'});
        document.getElementById('user_birthday').innerHTML = 
            new Date(user.birthday).toLocaleDateString('es-MX', {day:'numeric', month: 'short', year: 'numeric', timeZone:'UTC'});
    }

    if(page === "index.html"){
        document.getElementById('hero_welcome_message').classList.remove('d-none');
        document.getElementById('hero_login').classList.add('d-none');
        document.getElementById('hero_register').classList.add('d-none');
    }
}
document.addEventListener('DOMContentLoaded', init);