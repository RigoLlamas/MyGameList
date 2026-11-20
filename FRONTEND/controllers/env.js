const local_url = "http://localhost:3000/"
let page = window.location.pathname.split('/').pop();


function validateLogin(){
    if(!sessionStorage.user && window.location.href != local_url){
        alert("Favor de iniciar sesion");
        window.location.href = local_url;
    }
    if(sessionStorage.user && window.location.href == local_url){
        window.location.href = local_url + "views/index.html"
    }
}
validateLogin();