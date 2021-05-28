import * as Cookies from 'js-cookie';
import { dom } from 'mab-dom';

const dialog = dom('#set-dev-cookie-form-dialog');

const cookieOptions: Cookies.CookieAttributes = {
    sameSite: 'strict',
    secure: true
};

function setDevCookie(e: Event) {
    e.preventDefault();

    Cookies.set('vault-dev-username', dom('#Username').val(), cookieOptions);
    Cookies.set('vault-dev-password', dom('#Password').val(), cookieOptions);

    alert('Cookie set');
}

dialog.find('.btn-primary').on('click', setDevCookie);
