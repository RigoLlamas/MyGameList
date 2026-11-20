const local_url = "http://localhost:3000/"
const PUBLIC_PAGES = ['', 'index.html', 'login.html'];
let page = window.location.pathname.split('/').pop();


function validateLogin(){
    if(!sessionStorage.user && !PUBLIC_PAGES.includes(page)){
        alert("Favor de iniciar sesion");
        window.location.href = local_url + 'views/login.html';
    }
    if(sessionStorage.user && (page === '' || page === 'login.html')){
        window.location.href = local_url + "views/index.html";
    }
}
validateLogin();