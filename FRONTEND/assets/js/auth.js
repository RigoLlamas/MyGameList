const Auth = {
    estaLogueado(){
        return localStorage.getItem("usuario") !== null;
    },
    getUsuario(){
        return localStorage.getItem("usuario");
    },
    cerrarSesion(){
        localStorage.removeItem("usuario");
    },
};