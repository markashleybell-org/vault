import * as Handlebars from 'handlebars';
import { dom, DOM } from 'mab-dom';
import { Modal } from 'bootstrap';
import * as Cookies from 'js-cookie';
import Clipboard from 'clipboard';
import {
    generatePassword,
    getPasswordScore,
    getPasswordSpecificationFromPassword,
    isWeakPassword,
    mapToSummary,
    parsePasswordSpecificationString,
    parseSearchQuery,
    range,
    rateLimit,
    searchCredentials,
    sortCredentials,
    truncate,
    weakPasswordScoreThreshold
} from './modules/all';
import {
    ICredential,
    ISecurityKeyDetails,
    PasswordSpecification,
    Repository
} from './types/all';

interface IVaultGlobals {
    // Base URL (used mostly for XHR requests, particularly when app is hosted as a sub-application)
    baseUrl: string;
    // Current absolute URL (used for app refresh and auto-logout)
    absoluteUrl: string;
    sessionTimeoutInSeconds: number;
    securityKey?: ISecurityKeyDetails;
    devMode: boolean;
}

interface IVaultUIElements {
    body: DOM;
    loginFormDialog: Modal;
    loginForm: DOM;
    loginErrorMessage: DOM;
    container: DOM;
    controls: DOM;
    modal: Modal;
    modalContent: DOM;
    newButton: DOM;
    adminButton: DOM;
    clearSearchButton: DOM;
    searchInput: DOM;
    spinner: DOM;
}

interface IVaultUITemplates {
    urlLink: HandlebarsTemplateDelegate;
    urlText: HandlebarsTemplateDelegate;
    detail: HandlebarsTemplateDelegate;
    credentialForm: HandlebarsTemplateDelegate;
    deleteConfirmationDialog: HandlebarsTemplateDelegate;
    optionsDialog: HandlebarsTemplateDelegate;
    credentialTable: HandlebarsTemplateDelegate;
    credentialTableRow: HandlebarsTemplateDelegate;
    modalHeader: HandlebarsTemplateDelegate;
    modalBody: HandlebarsTemplateDelegate;
    modalFooter: HandlebarsTemplateDelegate;
    copyLink: HandlebarsTemplateDelegate;
    exportedDataWindow: HandlebarsTemplateDelegate;
}

interface IVaultModalOptions {
    title: string;
    content: string;
    credentialId?: string;
    showAccept?: boolean;
    acceptText?: string;
    onaccept?: (e: Event) => void;
    showClose?: boolean;
    closeText?: string;
    showEdit?: boolean;
    editText?: string;
    onedit?: (e: Event) => void;
    showDelete?: boolean;
    deleteText?: string;
    ondelete?: (e: Event) => void;
}

declare var _VAULT_GLOBALS: IVaultGlobals;

const sessionTimeoutMs = _VAULT_GLOBALS.sessionTimeoutInSeconds * 1000;

const repository = new Repository(_VAULT_GLOBALS.securityKey);

const defaultPasswordSpecification = new PasswordSpecification(16, true, true, true, true);

const ui: IVaultUIElements = {
    body: dom('body'),
    loginFormDialog: new Modal(dom('#login-form-dialog').get(), { keyboard: false, backdrop: 'static' }),
    loginForm: dom('#login-form'),
    loginErrorMessage: dom('#login-form-dialog').find('.validation-message'),
    container: dom('#container'),
    controls: dom('#controls'),
    modal: new Modal(dom('#modal').get()),
    modalContent: dom('#modal-content'),
    newButton: dom('#new'),
    adminButton: dom('#admin'),
    clearSearchButton: dom('#clear-search'),
    searchInput: dom('#search'),
    spinner: dom('#spinner')
};

const templates: IVaultUITemplates = {
    urlLink: Handlebars.compile(dom('#tmpl-urllink').html()),
    urlText: Handlebars.compile(dom('#tmpl-urltext').html()),
    detail: Handlebars.compile(dom('#tmpl-detail').html()),
    credentialForm: Handlebars.compile(dom('#tmpl-credentialform').html()),
    deleteConfirmationDialog: Handlebars.compile(dom('#tmpl-deleteconfirmationdialog').html()),
    optionsDialog: Handlebars.compile(dom('#tmpl-optionsdialog').html()),
    exportedDataWindow: Handlebars.compile(dom('#tmpl-exporteddatawindow').html()),
    credentialTable: Handlebars.compile(dom('#tmpl-credentialtable').html()),
    credentialTableRow: Handlebars.compile(dom('#tmpl-credentialtablerow').html()),
    modalHeader: Handlebars.compile(dom('#tmpl-modalheader').html()),
    modalBody: Handlebars.compile(dom('#tmpl-modalbody').html()),
    modalFooter: Handlebars.compile(dom('#tmpl-modalfooter').html()),
    copyLink: Handlebars.compile(dom('#tmpl-copylink').html())
};

Handlebars.registerPartial('credentialtablerow', templates.credentialTableRow);

Handlebars.registerPartial('copylink', templates.copyLink);

Handlebars.registerHelper('breaklines', (text: string) => {
    const escapedText = Handlebars.Utils.escapeExpression(text);
    return new Handlebars.SafeString(escapedText.replace(/(\r\n|\n|\r)/gm, '<br />'));
});

Handlebars.registerHelper('truncate', (text: string, size: number) => {
    const escapedText = Handlebars.Utils.escapeExpression(truncate(text, size));
    return new Handlebars.SafeString(escapedText);
});

let currentSession: any = null;

// Pure functions

export function isChecked(el: DOM) {
    return (el.get() as HTMLInputElement).checked;
}

export function checkIf(el: DOM, condition: boolean) {
    (el.get() as HTMLInputElement).checked = condition;
}

export function getPasswordSpecificationFromUI(container: DOM, predicate: (element: DOM) => boolean) {
    const len = parseInt(container.find('[name=len]').val() as string, 10);
    const specification = new PasswordSpecification(
        isNaN(len) ? 16 : len,
        predicate(container.find('[name=lcase]')),
        predicate(container.find('[name=ucase]')),
        predicate(container.find('[name=nums]')),
        predicate(container.find('[name=symb]'))
    );
    return specification;
}

export function updatePasswordSpecificationOptionUI(container: DOM, specification: PasswordSpecification) {
    container.find('[name=len]').val(specification.length);
    checkIf(container.find('[name=ucase]'), specification.uppercase);
    checkIf(container.find('[name=lcase]'), specification.lowercase);
    checkIf(container.find('[name=nums]'), specification.numbers);
    checkIf(container.find('[name=symb]'), specification.symbols);
}

export function getCredentialFromUI(container: DOM) {
    const obj: any = {};
    // Serialize the form inputs into an object
    container.find('input:not(.submit, .chrome-autocomplete-fake), textarea').each(el => {
        obj[(el.get() as HTMLInputElement).name] = el.val();
    });
    return (obj as ICredential);
}

export function parseImportData(rawData: string) {
    const jsonImportData = JSON.parse(rawData) as ICredential[];

    const newData = jsonImportData.map(item => {
        // Null out any existing credential ID so that the UpdateMultipleCredentials
        // endpoint knows that this is a new record, not an update
        item.CredentialID = null;
        return item;
    });

    return newData;
}

// Functions 'missing' from mab-dom which were in jQuery

function setWidth(el: DOM, val: string) {
    el.get().style.width = val;
}

function toggle(el: DOM, className: string) {
    const e = el.get();

    if (e.classList.contains(className)) {
        e.classList.remove(className);
    } else {
        e.classList.add(className);
    }
}

// Impure functions

const reloadApp = () => location.href = _VAULT_GLOBALS.absoluteUrl;

function setSession() {
    clearTimeout(currentSession);
    currentSession = setTimeout(reloadApp, sessionTimeoutMs);
}

function search(query: string, credentials: ICredential[]) {
    const parsedQuery = parseSearchQuery(query);
    const results = searchCredentials(parsedQuery, isWeakPassword, credentials);
    return sortCredentials(results);
}

function updateCredentialListUI(container: DOM, data: ICredential[]) {
    const rows = data.map(c => mapToSummary(c, isWeakPassword));
    container.html(templates.credentialTable({ rows: rows }));
}

async function withLoadSpinner<T>(action: () => Promise<T>) {
    ui.spinner.get().classList.remove('d-none');
    const result: T = await action();
    ui.spinner.get().classList.add('d-none');
    return result;
}

function confirmDelete(id: string) {
    showModal({
        title: 'Delete Credential',
        content: templates.deleteConfirmationDialog({}),
        showDelete: true,
        deleteText: 'Yes, Delete This Credential',
        ondelete: async e => {
            e.preventDefault();

            const updatedCredentials = await withLoadSpinner(async () => {
                await repository.deleteCredential(id);

                return await repository.loadCredentialSummaryList();
            });

            const results = search(ui.searchInput.val() as string, updatedCredentials);
            updateCredentialListUI(ui.container, results);

            ui.modal.hide();
        }
    });
}

async function editCredential(credentialId: string) {
    const credential = await withLoadSpinner(async () => await repository.loadCredential(credentialId));

    showModal({
        title: 'Edit Credential',
        content: templates.credentialForm(credential),
        showAccept: true,
        acceptText: 'Save',
        onaccept: (): void => {
            (dom('#credential-form').get() as HTMLFormElement).requestSubmit();
        }
    });

    ui.modalContent.find('#Description').focus();

    showPasswordStrength(ui.modalContent.find('#Password'));

    const savedPasswordSpecification = parsePasswordSpecificationString(credential.PwdOptions);
    const currentPasswordSpecification = getPasswordSpecificationFromPassword(credential.Password);

    // Rather convoluted, but this is why:
    // - If there's a valid password spec stored against the credential, use that
    // - If there isn't a stored spec, work out the spec from the current password and use that
    // - If there isn't a password, use the default specification
    const passwordSpecification = savedPasswordSpecification
        || currentPasswordSpecification
        || defaultPasswordSpecification;

    updatePasswordSpecificationOptionUI(ui.modalContent, passwordSpecification);
}

function openExportPopup(data: ICredential[]) {
    const exportWindow = open('', 'EXPORT_WINDOW', 'WIDTH=700, HEIGHT=600');
    if (exportWindow && exportWindow.top) {
        exportWindow.document.write(templates.exportedDataWindow({ json: JSON.stringify(data, undefined, 4) }));
    } else {
        alert('The export feature works by opening a popup window, but our popup window was blocked by your browser.');
    }
}

function optionsDialog() {
    showModal({
        title: 'Admin',
        content: templates.optionsDialog({})
    });
}

async function showDetail(credentialId: string) {
    const credential = await withLoadSpinner(async () => await repository.loadCredential(credentialId));

    // Slightly convoluted, but basically don't link up the URL if it doesn't contain a protocol
    const urlText = templates.urlText({ Url: credential.Url });
    const urlHtml = credential.Url.indexOf('//') === -1 ? urlText : templates.urlLink({ Url: credential.Url, UrlText: urlText });

    const charIndexes = range(0, credential.Password.length);

    const passwordCharacterTable = [
        '<table class="table table-bordered password-character-table">',
        '<thead>',
        '<tr>',
        charIndexes.map(i => `<th class="position">${(i + 1)}</th>`).join(''),
        '</tr>',
        '</thead>',
        '<tbody>',
        '<tr>',
        charIndexes.map(i => `<td>${credential.Password[i]}</td>`).join(''),
        '</tr>',
        '</tbody>',
        '</table>'
    ];

    const detailHtml = templates.detail({
        Url: credential.Url,
        UrlHtml: urlHtml,
        Username: credential.Username,
        Password: credential.Password,
        PasswordCharacterTable: passwordCharacterTable.join(''),
        UserDefined1: credential.UserDefined1,
        UserDefined1Label: credential.UserDefined1Label,
        UserDefined2: credential.UserDefined2,
        UserDefined2Label: credential.UserDefined2Label,
        Notes: credential.Notes
    });

    showModal({
        credentialId: credentialId,
        title: credential.Description,
        content: detailHtml,
        showEdit: true,
        showDelete: true,
        onedit: () => editCredential(credentialId),
        ondelete: () => confirmDelete(credentialId)
    });
}

function showModal(options: IVaultModalOptions) {
    const showAccept: boolean = options.showAccept || false;
    const showClose: boolean = options.showClose || true;
    const showEdit: boolean = options.showEdit || false;
    const showDelete: boolean = options.showDelete || false;

    let html: string = templates.modalHeader({
        title: options.title,
        closeText: options.closeText || 'Close',
        showAccept: showAccept,
        showClose: showClose,
        showEdit: showEdit,
        showDelete: showDelete
    }) + templates.modalBody({
        content: options.content
    });

    if (showAccept || showClose || showEdit || showDelete) {
        html += templates.modalFooter({
            credentialId: options.credentialId,
            acceptText: options.acceptText || 'OK',
            closeText: options.closeText || 'Close',
            editText: options.editText || 'Edit',
            deleteText: options.deleteText || 'Delete',
            showAccept: showAccept,
            showClose: showClose,
            showEdit: showEdit,
            showDelete: showDelete
        });
    }

    ui.modalContent.html(html);
    ui.modalContent.offchild('button.btn-accept', 'click');
    ui.modalContent.offchild('button.btn-edit', 'click');
    ui.modalContent.offchild('button.btn-delete', 'click');
    ui.modalContent.onchild('button.btn-accept', 'click', options.onaccept || ui.modal.hide);
    ui.modalContent.onchild('button.btn-edit', 'click',  options.onedit || (() => alert('NOT BOUND')));
    ui.modalContent.onchild('button.btn-delete', 'click',  options.ondelete || (() => alert('NOT BOUND')));
    ui.modal.show();
}

function showPasswordStrength(field: DOM) {
    const strengthIndicator = field.parent().find('div.password-strength');
    const status = strengthIndicator.find(':scope > .status');
    const bar = strengthIndicator.find(':scope > .progress > .progress-bar');
    const password = field.val() as string;
    const strength = getPasswordScore(password);
    // Score can be negative... which breaks progress bar
    const width = strength >= 0 ? strength : 0;
    bar.get().classList.remove('extremely-weak', 'very-weak', 'weak', 'average', 'strong', 'very-strong', 'extremely-strong');
    if (strength === 0) {
        status.html('No Password');
        setWidth(bar, '0');
    } else if (strength <= 100) {
        setWidth(bar, width + '%');
        if (strength <= 10) {
            bar.addClass('extremely-weak');
            status.html('Extremely Weak (' + strength + ')');
        } else if (strength <= 25) {
            bar.addClass('very-weak');
            status.html('Very Weak (' + strength + ')');
        } else if (strength <= weakPasswordScoreThreshold) {
            bar.addClass('weak');
            status.html('Weak (' + strength + ')');
        } else if (strength <= 55) {
            bar.addClass('average');
            status.html('Average (' + strength + ')');
        } else if (strength <= 75) {
            bar.addClass('strong');
            status.html('Strong (' + strength + ')');
        } else {
            bar.addClass('very-strong');
            status.html('Very Strong (' + strength + ')');
        }
    } else {
        bar.addClass('extremely-strong');
        status.html('Extremely Strong (' + strength + ')');
        setWidth(bar, '100%');
    }
}

// Event handlers

ui.container.onchild('.btn-credential-show-detail', 'click', e => {
    e.preventDefault();
    const id = e.targetElement.getAttribute('data-id');
    showDetail(id);
});

ui.newButton.on('click', e => {
    e.preventDefault();
    showModal({
        title: 'Add Credential',
        content: templates.credentialForm({}),
        showAccept: true,
        acceptText: 'Save',
        onaccept: (): void => {
            (dom('#credential-form').get() as HTMLFormElement).requestSubmit();
        }
    });
    ui.modalContent.find('#Description').focus();
    showPasswordStrength(ui.modalContent.find('#Password'));
    updatePasswordSpecificationOptionUI(ui.modalContent, defaultPasswordSpecification);
});

ui.adminButton.on('click', e => {
    e.preventDefault();
    optionsDialog();
});

ui.clearSearchButton.on('click', async e => {
    e.preventDefault();
    updateCredentialListUI(ui.container, []);
    ui.searchInput.val('')
    ui.searchInput.focus();
});

ui.searchInput.on('keyup', rateLimit(async e => {
    const credentials = await withLoadSpinner(async () => await repository.loadCredentialSummaryList());
    const results = search(ui.searchInput.val(), credentials);
    updateCredentialListUI(ui.container, results);
}, 200));

ui.loginForm.on('submit', async e => {
    e.preventDefault();

    await withLoadSpinner(async () => {
        const username = ui.loginForm.find('#UN1209').val() as string;
        const password = ui.loginForm.find('#PW9804').val() as string;

        ui.loginErrorMessage.get().innerText = '';

        const loginResult = await repository.login(username, password);

        if (loginResult.Success) {
            ui.loginForm.get().classList.add('d-none');
            ui.loginFormDialog.hide();
            ui.controls.get().classList.remove('d-none');
            ui.searchInput.focus();
            setSession();
            ui.body.on('click keyup', setSession);

            // TODO: REMOVE
            ui.searchInput.val('filter:all');
            const credentials = await withLoadSpinner(async () => await repository.loadCredentialSummaryList());
            const results = search(ui.searchInput.val(), credentials);
            updateCredentialListUI(ui.container, results);
        } else {
            ui.loginErrorMessage.get().innerText = 'Login failed';
        }
    });
});

ui.body.onchild('#credential-form', 'submit', async e => {
    e.preventDefault();

    const form = dom((e.targetElement as HTMLElement));



    const credential = getCredentialFromUI(form);

    const results = await withLoadSpinner(async () => {
        if (!credential.CredentialID) {
            await repository.createCredential(credential);
        } else {
            await repository.updateCredential(credential);
        }

        const updatedCredentials = await repository.loadCredentialSummaryList();

        return search(ui.searchInput.val() as string, updatedCredentials);
    });

    ui.modal.hide();

    updateCredentialListUI(ui.container, results);
});

// Show password strength as it is typed
ui.body.onchild('#Password', 'keyup', rateLimit(e => showPasswordStrength(dom(e.target)), 200));

ui.body.onchild('button.generate-password', 'click', e => {
    e.preventDefault();
    const passwordSpecification = getPasswordSpecificationFromUI(ui.modalContent, isChecked);
    const password = generatePassword(passwordSpecification);
    dom('#Password').val(password);
    const opts = [parseInt(dom('#len').val(), 10),
    isChecked(dom('#ucase')) ? 1 : 0,
    isChecked(dom('#lcase')) ? 1 : 0,
    isChecked(dom('#nums')) ? 1 : 0,
    isChecked(dom('#symb')) ? 1 : 0];
    dom('#PwdOptions').val(opts.join('|'));
    showPasswordStrength(dom('#Password'));
});

// Toggle password generation option UI visibility
ui.body.onchild('a.generate-password-options-toggle', 'click', e => {
    e.preventDefault();
    toggle(dom('div.generate-password-options'), 'd-none');
});

ui.body.onchild('.copy-link', 'click', e => {
    e.preventDefault();
    dom('.copy-link').find('span').removeClass('copied').addClass('bi-clipboard').removeClass('bi-clipboard-check');
});

// For the links, we need to pass in the container modal element; this deals with the fact that
// the modal steals focus. Without this, content appears to be copied, but you can't paste it.
// See https://github.com/zenorocha/clipboard.js/issues/514
const copyLinks = new Clipboard('.copy-link', {
    container: document.getElementById('modal-content')
});

copyLinks.on('success', function (e) {
    const a = dom((e.trigger as HTMLElement));
    a.find('span').addClass('copied').removeClass('bi-clipboard').addClass('bi-clipboard-check');

    // e.clearSelection();
});

ui.body.onchild('a.toggle-password-info', 'click', e => {
    e.preventDefault();
    toggle(dom('#modal').find('.row-detail-password-info'), 'd-none');
});

ui.body.onchild('a.btn-credential-open', 'click', e => {
    e.preventDefault();
    open(dom((e.targetElement as HTMLElement)).data('url'));
});

ui.body.onchild('.btn-credential-copy', 'click', e => {
    e.preventDefault();
    const allButtons = dom('a.btn-credential-copy');
    allButtons.removeClass('btn-success').addClass('btn-primary');
    allButtons.find('span').addClass('bi-clipboard').removeClass('bi-clipboard-check');
});

const copyButtons = new Clipboard('.btn-credential-copy');

copyButtons.on('success', function (e) {
    const a = dom((e.trigger as HTMLElement));
    a.removeClass('btn-primary').addClass('btn-success');
    a.find('span').addClass('copied').removeClass('bi-clipboard').addClass('bi-clipboard-check');

    // e.clearSelection();
});

// Automatically focus the search field if a key is pressed from the credential list
ui.body.on('keydown', e => {
    const eventTarget = e.target as HTMLElement;
    if (eventTarget.nodeName === 'BODY') {
        e.preventDefault();
        // Cancel the first mouseup event which will be fired after focus
        //ui.searchInput.one('mouseup', me => {
        //    me.preventDefault();
        //});
        ui.searchInput.focus();
        //const char = String.fromCharCode(e.keyCode);
        //if (/[a-zA-Z0-9]/.test(char)) {
        //    ui.searchInput.val(e.shiftKey ? char : char.toLowerCase());
        //} else {
        //    (ui.searchInput.get() as HTMLInputElement).select();
        //}
    }
});

ui.body.onchild('#change-password-button', 'click', async e => {
    const newPassword = dom('#NewPassword').val() as string;
    const newPasswordConfirm = dom('#NewPasswordConfirm').val() as string;

    const confirmationMsg = 'When the password change is complete you will be logged out and will need to log back in.\n\n'
        + 'Are you SURE you want to change the master password?';

    if (newPassword === '') {
        alert('Password cannot be left blank.');
        return;
    }

    if (newPassword !== newPasswordConfirm) {
        alert('Password confirmation does not match password.');
        return;
    }

    if (!confirm(confirmationMsg)) {
        return;
    }

    await withLoadSpinner(async () => await repository.updatePassword(newPassword));

    reloadApp();
});

ui.body.onchild('#export-button', 'click', async e => {
    const exportedData = await withLoadSpinner(async () => await repository.loadCredentials());
    openExportPopup(exportedData);
});

ui.body.onchild('#import-button', 'click', async e => {
    e.preventDefault();
    await withLoadSpinner(async () => {
        const rawData = dom('#import-data').val() as string;
        const parsedData = parseImportData(rawData);
        await repository.import(parsedData);
    });
    reloadApp();
});

// If we're in dev mode, automatically log in with a cookie manually created on the dev machine
if (_VAULT_GLOBALS.devMode) {
    ui.loginForm.find('#UN1209').val(Cookies.get('vault-dev-username'));
    ui.loginForm.find('#PW9804').val(Cookies.get('vault-dev-password'));
    const form = ui.loginForm.get() as HTMLFormElement;
    form.requestSubmit();
} else {
    ui.loginForm.find('#UN1209').focus();
}

ui.loginFormDialog.show();
