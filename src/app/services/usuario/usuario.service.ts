import { Injectable } from '@angular/core';
import { Usuario } from '../../models/usuario.model';
import { HttpClient } from '@angular/common/http';
import { URL_SERVICIOS } from '../../config/config';

import swal from 'sweetalert';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SubirArchivoService } from '../subirArchivo/subir-archivo.service';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  usuario: Usuario;
  token: string;

  constructor(public http: HttpClient,
              public router: Router,
              public _subirArchivo: SubirArchivoService) {
    this.cargarStorage();
  }

  estaLogueado() {
    return ( this.token.length > 5  ) ? true : false;
  }

  cargarStorage() {
    if (localStorage.getItem('token')) {
        this.token = localStorage.getItem('token');
        this.usuario = JSON.parse(localStorage.getItem('usuario'));
    } else {
      this.token = '';
      this.usuario = null;
    }
  }

  guardarStorage(id: string, token: string, usuario: Usuario) {
    localStorage.setItem('id', id);
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));

    this.usuario = usuario;
    this.token = token;
  }

  logout() {
    this.usuario = null;
    this.token = '';

    // localStorage.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    this.router.navigate(['/login']);
  }

  loginGoogle(token: string) {

    const url = URL_SERVICIOS + '/login/google';

    return this.http.post(url, { token })
               .pipe(
                 map( (resp: any) => {
                   this.guardarStorage(resp.id, resp.token, resp.usuario);
                   return true;
                 })
               );
  }

  login(usuario: Usuario, recordar: boolean = false) {

    if (recordar) {
      localStorage.setItem('email', usuario.email);
    } else {
      localStorage.removeItem('email');
    }

    const url = URL_SERVICIOS + '/login';

    return this.http.post(url, usuario).pipe(
          map( (resp: any) => {
              // localStorage.setItem('id', resp.id);
              // localStorage.setItem('token', resp.token);
              // localStorage.setItem('usuario', JSON.stringify(resp.usuario));
              this.guardarStorage(resp.id, resp.token, resp.usuario);
              return true;
          })
    );
  }

  crearUsuario (usuario: Usuario) {

    const url = URL_SERVICIOS + '/usuario';

    return this.http.post( url, usuario)
               .pipe(map((resp: any) => {
                  swal('Usuario creado', usuario.email, 'success');
                  return resp.usuario;
               }));
  }

  actualizarUsuario (usuario: Usuario) {

    let url = URL_SERVICIOS + '/usuario/' + usuario._id;
    url += '?token=' + this.token;

    console.log(url);

    return this.http.put(url, usuario).pipe(
        map((resp: any) => {
          // this.usuario = resp.usuario;
          if (usuario._id === this.usuario._id) {
            const usuarioDB: Usuario = resp.usuario;
            this.guardarStorage(usuarioDB._id, this.token, usuarioDB);
          }
          swal('Usuario actualizado', usuario.nombre, 'success');

          return true;
        })
    );
  }

  cambiarImagen(file: File, id: string) {
    this._subirArchivo.subirArchivo(file, 'usuarios', id)
                      .then( (resp: any) => {
                        this.usuario.img =  resp.usuario.img;
                        this.guardarStorage(id, this.token, this.usuario);
                        swal('Imagen Actualizada', this.usuario.nombre, 'success');
                      })
                      .catch( resp => {
                        console.log(resp);
                      });
  }

  cargarUsuarios(desde: number = 0) {
    const url = URL_SERVICIOS + '/usuario?desde=' + desde;

    return this.http.get(url);
  }

  buscarUsuarios(termino: string) {
    const url = URL_SERVICIOS + '/busqueda/coleccion/usuarios/' + termino;

    return this.http.get(url)
            .pipe(
              map( (resp: any) => {
                return resp.usuarios;
              })
            );
  }

  borrarUsuario(id: string) {
    let url = URL_SERVICIOS + '/usuario/' + id;
    url += '?token=' + this.token;

    return this.http.delete(url).pipe(
          map( (resp: any) => {
            swal('Usuario borrado', 'El usuario a sido eliminado correctamente', 'success');
            return true;
          })
    );
  }
}
