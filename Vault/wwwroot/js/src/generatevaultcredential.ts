import { hash, hex } from './modules/all';
import { dom } from 'mab-dom';

const dialog = dom('#generate-form-dialog');

async function generatePassword(e: Event) {
    e.preventDefault();

    const usernameHash = await hash(dom('#Username').val() as string);
    const passwordHash = await hash(dom('#Password').val() as string);

    dom('#HashedUsername').val(hex(usernameHash));
    dom('#HashedPassword').val(hex(passwordHash));
}

dialog.find('.btn-primary').on('click', generatePassword);
