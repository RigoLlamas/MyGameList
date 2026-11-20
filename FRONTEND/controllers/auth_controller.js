function login(){
    event.preventDefault();
    let data = new FormData(event.target);

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
        window.location.href = local_url + 'views/index.html';
    })
    .catch(err => {
        console.error("Error en Login:", err);
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
    let data = new FormData(event.target);

    fetch('/users', {
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
        window.location.href = local_url + 'views/index.html';
    })
    .catch(err => {
        console.error("Error en Registro:", err);
    })
}
let formRegister = document.getElementById('formRegister');
if(formRegister) formRegister.addEventListener('submit', register);

function populateModal(){
    let user = JSON.parse(sessionStorage.user);
    document.getElementById('inputUsername').value = user.name;
    document.getElementById('inputBio').value = user.bio || '';
    document.getElementById('inputPassword').value = user.password;
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
    let data = new FormData(event.target);

    fetch('/users/'+user.id, {
        method: 'PATCH',
        headers: {
            'x-auth': user.password,
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
    .then(response => {
        sessionStorage.setItem('user', JSON.stringify(response.user));
        alert("Cambios Realizados")
        init()
        window.location.href = local_url + 'views/index.html';
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
        document.getElementById('user_name').innerHTML = user.name;
        document.getElementById('user_joined_at').innerHTML = 
            new Date(user.joined_at).toLocaleDateString('es-MX', {month: 'short', year: 'numeric'});
        document.getElementById('user_birthday').innerHTML = 
            new Date(user.birthday).toLocaleDateString('es-MX', {day:'numeric', month: 'short', year: 'numeric'});
    }
}
document.addEventListener('DOMContentLoaded', init);