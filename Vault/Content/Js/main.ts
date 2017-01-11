/// <reference path="types/bootstrap.d.ts" />
/// <reference path="types/jquery.d.ts" />
/// <reference path="types/passpack.d.ts" />
/// <reference path="types/handlebars.d.ts" />
/// <reference path="types/js.cookie.d.ts" />
/// <reference path="types/vault.d.ts" />

/* tslint:disable */

let Vault = (function ($, Passpack, Handlebars, Cookies, window, document) {
    'use strict';

    /* tslint:enable */
    /* tslint:disable:comment-format quotemark */

    const _weakPasswordThreshold: number = 40,      // Bit value below which password is deemed weak
          _artificialAjaxDelay: boolean = false;    // Introduce an artificial delay for AJAX calls so we can test loaders locally

    let _userId: string = '', // GUID identifying logged-in user
        _password: string = '', // Current user's password
        _masterKey: string = '', // Master key for Passpack encryption (Base64 encoded hash of (password + hashed pasword))
        _cachedList: Credential[] = [], // Hold the credential summary list in memory to avoid requerying/decrypting after save
        _basePath: string = null, // Base URL (used mostly for XHR requests, particularly when app is hosted as a sub-application)
        _public: any = {}, // Public function container
        // A map of the properties which can be searched for using the fieldName:query syntax
        // We need this because the search is not case-sensitive, whereas JS properties are!
        _queryablePropertyMap: any = {
            description: 'Description',
            username: 'Username',
            password: 'Password',
            url: 'Url',
            filter: 'FILTER'
        },
        _ui: any = {
            loginFormDialog: null,
            loginForm: null,
            container: null,
            controls: null,
            modal: null,
            modalContent: null,
            records: null,
            newButton: null,
            adminButton: null,
            clearSearchButton: null,
            searchInput: null,
            spinner: null
        },
        _templates: any = {
            urlLink: null,
            urlText: null,
            detail: null,
            credentialForm: null,
            deleteConfirmationDialog: null,
            optionsDialog: null,
            credentialTable: null,
            credentialTableRow: null,
            validationMessage: null,
            modalHeader: null,
            modalBody: null,
            modalFooter: null,
            copyLink: null,
            exportedDataWindow: null
        };

    // Encrypt/decrypt the properties of an object literal using Passpack
    // excludes is an array of property names whose values should not be encrypted
    function _crypt(action: IPasspackCryptoFunction, obj: any, masterKey: string, excludes: string[]): Credential {
        var newCredential: any = {};
        Object.keys(obj).forEach(function (k: string): void {
            if (excludes.indexOf(k) === -1) {
                newCredential[k] = action('AES', obj[k], _b64_to_utf8(masterKey));
            } else {
                newCredential[k] = obj[k];
            }
        });
        return newCredential;
    }

    function _encryptObject(obj: any, masterKey: string, excludes: string[]): Credential {
        return _crypt(Passpack.encode, obj, masterKey, excludes);
    }

    function _decryptObject(obj: any, masterKey: string, excludes: string[]): Credential {
        return _crypt(Passpack.decode, obj, masterKey, excludes);
    }

    function _createMasterKey(password: string): string {
        return Passpack.utils.hashx(password + Passpack.utils.hashx(password, true, true), true, true);
    }

    // Remove the item with a specific ID from an array
    function _removeFromList(id: string, list: Credential[]): void {
        list.forEach(function (item: Credential, i: number): void {
            if (item.CredentialID === id) {
                list.splice(i, 1);
            }
        });
    }

    // Update properties of the item with a specific ID in a list
    function _updateProperties(id: string, properties: any, userId: string, list: Credential[]): void {
        let items: Credential[] = list.filter(function (item: Credential): boolean {
            return item.CredentialID === id;
        });
        // If an item with the ID already exists
        if (items.length) {
            // Map the property values to it
            $.extend(items[0], properties);
        } else {
            // If we didn't find an existing item, add a new item with the supplied property values
            list.push($.extend({ CredentialID: id, UserID: userId }, properties));
        }
    }

    function _defaultAjaxErrorCallback(ignore: JQueryXHR, status: string, error: string): void {
        return window.alert('Http Error: ' + status + ' - ' + error);
    }

    function _ajaxPost(url: string, data: any, successCallback: IXHRSuccess, errorCallback?: IXHRError, contentType?: string): void {
        _ui.spinner.show();

        if (!errorCallback) {
            errorCallback = _defaultAjaxErrorCallback;
        }

        let options: any = {
            url: url,
            data: data,
            dataType: 'json',
            type: 'POST',
            success: function (data: any, status: string, request: JQueryXHR): void {
                _ui.spinner.hide();
                successCallback(data, status, request);
            },
            error: function (request: JQueryXHR, status: string, error: string): void {
                _ui.spinner.hide();
                errorCallback(request, status, error);
            }
        };

        if (contentType) {
            options.contentType = contentType;
        }

        if (!_artificialAjaxDelay) {
            $.ajax(options);
        } else {
            window.setTimeout(function (): void {
                $.ajax(options);
            }, 2000);
        }
    }

    // Load all records for a specific user
    function _loadCredentials(userId: string, masterKey: string, callback: Function): void {
        if (_cachedList !== null && _cachedList.length) {
            _buildDataTable(_cachedList, callback, masterKey, userId);
        } else {
            _ajaxPost(_basePath + 'Main/GetAll', { userId: userId }, function (data: Credential[]): void {
                // At this point we only actually need to decrypt a few things for display/search
                // which speeds up client-side table construction time dramatically
                let items: Credential[] = data.map(function (item: Credential): Credential {
                    return _decryptObject(item, masterKey, ['CredentialID', 'UserID']);
                });
                // Cache the whole (decrypted) list on the client
                _cachedList = items;
                _sortCredentials(_cachedList);
                _buildDataTable(_cachedList, callback, masterKey, userId);
            });
        }
    }

    // Show the read-only details modal
    function _showDetail(credentialId: string, masterKey: string): void {
        _ajaxPost(_basePath + 'Main/Load', { id: credentialId }, function (data: Credential): void {
            // CredentialID and UserID are not currently encrypted so don't try to decode them
            data = _decryptObject(data, masterKey, ['CredentialID', 'UserID']);
            // Slightly convoluted, but basically don't link up the URL if it doesn't contain a protocol
            let urlText: string = _templates.urlText({ Url: data.Url });
            let urlHtml: string = data.Url.indexOf('//') === -1 ? urlText : _templates.urlLink({ Url: data.Url, UrlText: urlText });

            let detailHtml: string = _templates.detail({
                Url: data.Url,
                UrlHtml: urlHtml,
                Username: data.Username,
                Password: data.Password,
                UserDefined1: data.UserDefined1,
                UserDefined1Label: data.UserDefined1Label,
                UserDefined2: data.UserDefined2,
                UserDefined2Label: data.UserDefined2Label,
                Notes: data.Notes
            });

            _showModal({
                credentialId: credentialId,
                title: data.Description,
                content: detailHtml,
                showEdit: true,
                showDelete: true,
                onedit: function (): void { _loadCredential($(this).data('credentialid'), masterKey); },
                ondelete: function (): void { _confirmDelete($(this).data('credentialid'), masterKey); }
            });
        });
    }

    // Default action for modal accept button
    function _defaultAcceptAction(e: Event): void {
        e.preventDefault();
        _ui.modal.modal('hide');
    }

    // Default action for modal close button
    function _defaultCloseAction(e: Event): void {
        e.preventDefault();
        _ui.modal.modal('hide');
    }

    // Show a Bootstrap modal with options as below
    // let modalOptions = {
    //     credentialId: '9c75660b-13ae-4c4f-b1d7-6770498a2466',
    //     title: 'TEST',
    //     content: '<p>TEST</p>',
    //     showAccept: true,
    //     showClose: true,
    //     showEdit: true,
    //     showDelete: true,
    //     acceptText: 'OK',
    //     accept: function() {}
    //     closeText: 'Close',
    //     close: function() {}
    //     editText: 'Edit',
    //     edit: function() {}
    //     deleteText: 'Delete',
    //     delete: function() {}
    // };
    function _showModal(options: any): void {
        let showAccept: boolean = options.showAccept || false,
            showClose: boolean = options.showClose || true,
            showEdit: boolean = options.showEdit || false,
            showDelete: boolean = options.showDelete || false,
            html: string = _templates.modalHeader({
                title: options.title,
                closeText: options.closeText || 'Close',
                showAccept: showAccept,
                showClose: showClose,
                showEdit: showEdit,
                showDelete: showDelete
            }) + _templates.modalBody({
                content: options.content
            });

        if (showAccept || showClose || showEdit || showDelete) {
            html += _templates.modalFooter({
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

        _ui.modalContent.html(html);
        _ui.modal.off('click', 'button.btn-accept');
        _ui.modal.off('click', 'button.btn-close');
        _ui.modal.off('click', 'button.btn-edit');
        _ui.modal.off('click', 'button.btn-delete');
        _ui.modal.on('click', 'button.btn-accept', options.onaccept || _defaultAcceptAction);
        _ui.modal.on('click', 'button.btn-close', options.onclose || _defaultCloseAction);
        _ui.modal.on('click', 'button.btn-edit', options.onedit || function (): void { window.alert('NOT BOUND'); });
        _ui.modal.on('click', 'button.btn-delete', options.ondelete || function (): void { window.alert('NOT BOUND'); });
        _ui.modal.modal();
    }

    function _getPasswordLength(): number {
        let len: number = parseInt($('#len').val(), 10);
        return isNaN(len) ? 16 : len;
    }

    function _getPasswordGenerationOptions(): any {
        let options: any = {};
        $('input.generate-password-option').each(function (): void {
            let checkbox: JQuery = $(this);
            if (_isChecked(checkbox)) {
                options[checkbox.attr('name')] = 1;
            }
        });
        return options;
    }

    function _isChecked(el: JQuery): boolean {
        return (<HTMLInputElement>el[0]).checked;
    }

    function _checkIf(el: JQuery, condition: () => boolean): void {
        (<HTMLInputElement>el[0]).checked = condition();
    }

    // Load a record into the edit form
    // If null is passed as the credentialId, we set up the form for adding a new record
    function _loadCredential(credentialId: string, masterKey: string): void {
        if (credentialId !== null) {
            _ajaxPost(_basePath + 'Main/Load', { id: credentialId }, function (data: Credential): void {
                // CredentialID and UserID are not currently encrypted so don't try to decode them
                data = _decryptObject(data, masterKey, ['CredentialID', 'UserID']);
                _showModal({
                    title: 'Edit Credential',
                    content: _templates.credentialForm(data),
                    showAccept: true,
                    acceptText: 'Save',
                    onaccept: function (): void {
                        $('#credential-form').submit();
                    }
                });
                _ui.modal.find('#Description').focus();
                _showPasswordStrength(_ui.modal.find('#Password'));
                _setPasswordOptions(_ui.modal, data.PwdOptions);
            });
        } else { // New record setup
            _showModal({
                title: 'Add Credential',
                content: _templates.credentialForm({ UserID: _userId }),
                showAccept: true,
                acceptText: 'Save',
                onaccept: function (): void {
                    $('#credential-form').submit();
                }
            });
            _ui.modal.find('#Description').focus();
            _showPasswordStrength(_ui.modal.find('#Password'));
        }
    }

    // Delete a record
    function _deleteCredential(credentialId: string, userId: string, masterKey: string): void {
        _ajaxPost(_basePath + 'Main/Delete', { credentialId: credentialId, userId: userId }, function (data: any): void {
            if (data.Success) {
                // Remove the deleted item from the cached list before reload
                _removeFromList(credentialId, _cachedList);
                // For now we just reload the entire table in the background
                _loadCredentials(userId, masterKey, function (): void {
                    _ui.modal.modal('hide');
                    let results: Credential[] = _search(_ui.searchInput.val(), _cachedList);
                    _buildDataTable(results, function (rows: CredentialSummary[]): void {
                        _ui.container.html(_createCredentialTable(rows));
                    }, _masterKey, userId);
                });
            }
        });
    }

    // Show delete confirmation dialog
    function _confirmDelete(id: string, masterKey: string): void {
        _showModal({
            title: 'Delete Credential',
            content: _templates.deleteConfirmationDialog(),
            showDelete: true,
            deleteText: 'Yes, Delete This Credential',
            ondelete: function (e: Event): void {
                e.preventDefault();
                _deleteCredential(id, _userId, masterKey);
            }
        });
    }

    // Generate standard hash for a password
    function _generatePasswordHash(password: string): string {
        return Passpack.utils.hashx(password);
    }

    // Generate 64-bit hash for a password
    function _generatePasswordHash64(password: string): string {
        // The hash is now a full 64 char string
        return Passpack.utils.hashx(password, false, true);
    }

    // Change the password and re-encrypt all credentials with the new password
    function _changePassword(userId: string, masterKey: string): void {
        let newPassword: string = $('#NewPassword').val(),
            newPasswordConfirm: string = $('#NewPasswordConfirm').val(),
            confirmationMsg: string = 'When the password change is complete you will be logged out and will need to log back in.\n\n'
                                    + 'Are you SURE you want to change the master password?';

        if (newPassword === '') {
            window.alert('Password cannot be left blank.');
            return;
        }

        if (newPassword !== newPasswordConfirm) {
            window.alert('Password confirmation does not match password.');
            return;
        }

        if (!window.confirm(confirmationMsg)) {
            return;
        }

        let newPasswordHash: string = Passpack.utils.hashx(newPassword),
            newMasterKey: string = _utf8_to_b64(_createMasterKey(newPassword));

        // Get all the credentials, decrypt each with the old password
        // and re-encrypt it with the new one
        _ajaxPost(_basePath + 'Main/GetAllComplete', { userId: userId }, function (data: Credential[]): void {
            let excludes: string[] = ['CredentialID', 'UserID', 'PasswordConfirmation'];
            let newData: Credential[] = data.map(function (item: Credential): Credential {
                return _encryptObject(_decryptObject(item, _b64_to_utf8(masterKey), excludes), newMasterKey, excludes);
            });

            _ajaxPost(_basePath + 'Main/UpdateMultiple', JSON.stringify(newData), function (): void {
                // Store the new password in hashed form
                _ajaxPost(_basePath + 'Main/UpdatePassword', {
                    newHash: newPasswordHash,
                    userid: userId,
                    oldHash: Passpack.utils.hashx(_password)
                }, function (): void {
                    // Just reload the whole page when we're done to force login
                    window.location.href = _basePath.length > 1 ? _basePath.slice(0, -1) : _basePath;
                });
            }, null, 'application/json; charset=utf-8');
        });
    }

    // Export all credential data as JSON
    function _exportData(userId: string, masterKey: string): void {
        // Get all the credentials, decrypt each one
        _ajaxPost(_basePath + 'Main/GetAllComplete', { userId: userId }, function (data: Credential[]): void {
            let exportItems: Credential[] = data.map(function (item: Credential): Credential {
                let o: Credential = _decryptObject(item, _b64_to_utf8(masterKey), ['CredentialID', 'UserID', 'PasswordConfirmation']);
                delete o.PasswordConfirmation; // Remove the password confirmation as it's not needed for export
                return o;
            });

            let exportWindow:Window = window.open('', 'EXPORT_WINDOW', 'WIDTH=700, HEIGHT=600');
            if (exportWindow && exportWindow.top) {
                exportWindow.document.write(_templates.exportedDataWindow({ json: JSON.stringify(exportItems, undefined, 4) }));
            } else {
                window.alert('The export feature works by opening a popup window, but our popup window was blocked by your browser.');
            }
        });
    }

    // Import unencrypted JSON credential data
    function _importData(userId: string, masterKey: string, rawData: string): void {
        let jsonImportData: Credential[] = JSON.parse(rawData);
        let excludes: string[] = ['CredentialID', 'UserID'];

        let newData: Credential[] = jsonImportData.map(function (item: Credential): Credential {
            // Remove the confirmation property
            delete item.PasswordConfirmation;
            // Null out the old credential ID so UpdateMultiple knows this is a new record
            item.CredentialID = null;
            // Set the user ID to the ID of the new (logged in) user
            item.UserID = userId;
            return _encryptObject(item, _b64_to_utf8(masterKey), excludes);
        });

        _ajaxPost(_basePath + 'Main/UpdateMultiple', JSON.stringify(newData), function (): void {
            // Just reload the whole page when we're done to force login
            window.location.href = _basePath.length > 1 ? _basePath.slice(0, -1) : _basePath;
        }, null, 'application/json; charset=utf-8');
    }

    // Show the options dialog
    function _options(): void {
        let dialogHtml: string = _templates.optionsDialog({
            userid: _userId,
            masterkey: _utf8_to_b64(_masterKey)
        });

        _showModal({
            title: 'Admin',
            content: dialogHtml
        });
    }

    // Build the data table
    function _buildDataTable(data: Credential[], callback: Function, masterKey: string, userId: string): void {
        // Create a table row for each record and add it to the rows array
        let rows: CredentialSummary[] = data.map(function (item: Credential): CredentialSummary {
            return _createCredentialDisplayData(item, masterKey, userId);
        });

        // Fire the callback and pass it the array of rows
        callback(rows);
    }

    // Create the credential table
    function _createCredentialTable(rows: CredentialSummary[]): string {
        return _templates.credentialTable({ rows: rows });
    }

    // Create a single table row for a credential
    function _createCredentialDisplayData(credential: Credential, masterKey: string, userId: string): CredentialSummary {
        return {
            credentialid: credential.CredentialID,
            masterkey: masterKey,
            userid: userId,
            description: credential.Description,
            username: credential.Username,
            password: credential.Password,
            url: credential.Url,
            weak: $.trim(credential.Password) !== '' && Passpack.utils.getBits(credential.Password) < _weakPasswordThreshold
        };
    }

    // Validate a credential record form
    function _validateRecord(f: JQuery): any[] {
        let errors: any[] = [],
            description: JQuery = f.find('#Description'),
            password: JQuery = f.find('#Password'),
            passwordConfirmation: JQuery = f.find('#PasswordConfirmation');

        if (description.val() === '') {
            errors.push({ field: description, msg: 'You must fill in a Description' });
        }

        // We don't mind if these are blank, but they must be the same!
        if (password.val() !== passwordConfirmation.val()) {
            errors.push({ field: passwordConfirmation, msg: 'Password confirmation does not match' });
        }

        return errors;
    }

    // Encode string to Base64
    function _utf8_to_b64(str: string): string {
        return window.btoa(encodeURIComponent(escape(str)));
    }

    // Decode Base64 string
    function _b64_to_utf8(str: string): string {
        return unescape(decodeURIComponent(window.atob(str)));
    }

    // Truncate a string at a specified length
    function _truncate(str: string, len: number): string {
        return str.length > len ? str.substring(0, len - 3) + '...' : str;
    }

    // Hide credential rows which don't contain a particular string
    function _search(query: string, list: Credential[]): Credential[] {
        let results: Credential[] = [],
            queryField: string,
            queryData: string[];
        // Tidy up the query text
        query = $.trim(query).toLowerCase();
        if (query !== null && query !== '' && query.length > 1) {
            queryField = _queryablePropertyMap.description;
            // Support queries in the form fieldName:query (e.g. username:me@email.com)
            if (query.indexOf(':') !== -1) {
                queryData = query.split(':');
                // Safeguard against spaces either side of colon, query part not
                // having been typed yet and searches on a non-existent property
                if (queryData.length === 2 && queryData[0] !== '' && queryData[1] !== '') {
                    // If the fieldName part exists in the property map
                    if (_queryablePropertyMap[queryData[0]]) {
                        queryField = _queryablePropertyMap[queryData[0]];
                        query = queryData[1];
                    }
                }
            }
            if (queryField === 'FILTER') {
                if (query === 'all') {
                    results = list;
                } else if (query === 'weak') {
                    results = list.filter(function (item: Credential): boolean {
                        let pwd: string = item.Password;
                        return pwd && Passpack.utils.getBits(pwd) <= _weakPasswordThreshold;
                    });
                }
            } else {
                results = list.filter(function (item: Credential): boolean {
                    return item[queryField].toLowerCase().indexOf(query) > -1;
                });
            }
        }
        return results;
    }

    // Rate-limit calls to the supplied function
    function _debounce(func: Function, wait?: number, immediate?: boolean): (e: Event) => void {
        let timeout: number;
        return function (): void {
            let context: Function = this, args: IArguments = arguments;
            let later: Function = function (): void {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            };
            let callNow: boolean = immediate && !timeout;
            window.clearTimeout(timeout);
            timeout = window.setTimeout(later, wait);
            if (callNow) {
                func.apply(context, args);
            }
        };
    }

    // Sort credentials alphabetically by description
    function _sortCredentials(credentials: Credential[]): void {
        credentials.sort(function (a: Credential, b: Credential): number {
            let desca: string = a.Description.toUpperCase(),
                descb: string = b.Description.toUpperCase();
            return desca < descb ? -1 : desca > descb ? 1 : 0;
        });
    }

    // Show password strength visually
    function _showPasswordStrength(field: JQuery): void {
        let strengthIndicator: JQuery = field.next('div.password-strength'),
            status: JQuery = strengthIndicator.find('> span'),
            bar: JQuery = strengthIndicator.find('> div'),
            strength: number = Passpack.utils.getBits(field.val());
        bar.removeClass();
        if (strength === 0) {
            status.html('No Password');
            bar.css('width', 0);
        } else if (strength <= 100) {
            bar.css('width', strength + '%');
            if (strength <= 10) {
                bar.addClass('extremely-weak');
                status.html('Extremely Weak (' + strength + ')');
            } else if (strength <= 25) {
                bar.addClass('very-weak');
                status.html('Very Weak (' + strength + ')');
            } else if (strength <= _weakPasswordThreshold) {
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
            bar.css('width', '100%');
        }
    }

    function _setPasswordOptions(form: JQuery, opts: string): void {
        let optArray: string[] = opts.split('|');
        form.find('[name=len]').val(optArray[0]);
        _checkIf(form.find('[name=ucase]'), () => optArray[1] === '1');
        _checkIf(form.find('[name=lcase]'), () => optArray[2] === '1');
        _checkIf(form.find('[name=nums]'), () => optArray[3] === '1');
        _checkIf(form.find('[name=symb]'), () => optArray[4] === '1');
    }

    // Initialise the app
    function _init(basePath: string, testMode: boolean, devMode: boolean): void {
        // Set the base path for AJAX requests/redirects
        _basePath = basePath;
        // Determine whether we're testing or not
        if (testMode) {
            let testMethods: any = {
                crypt: _crypt,
                encryptObject: _encryptObject,
                decryptObject: _decryptObject,
                createMasterKey: _createMasterKey,
                removeFromList: _removeFromList,
                updateProperties: _updateProperties,
                defaultAjaxErrorCallback: _defaultAjaxErrorCallback,
                ajaxPost: _ajaxPost,
                loadCredentials: _loadCredentials,
                showDetail: _showDetail,
                defaultAcceptAction: _defaultAcceptAction,
                defaultCloseAction: _defaultCloseAction,
                showModal: _showModal,
                loadCredential: _loadCredential,
                deleteCredential: _deleteCredential,
                confirmDelete: _confirmDelete,
                generatePasswordHash: _generatePasswordHash,
                generatePasswordHash64: _generatePasswordHash64,
                changePassword: _changePassword,
                exportData: _exportData,
                options: _options,
                buildDataTable: _buildDataTable,
                createCredentialTable: _createCredentialTable,
                createCredentialDisplayData: _createCredentialDisplayData,
                validateRecord: _validateRecord,
                utf8_to_b64: _utf8_to_b64,
                b64_to_utf8: _b64_to_utf8,
                truncate: _truncate,
                search: _search,
                debounce: _debounce,
                sortCredentials: _sortCredentials,
                init: _init
            };
            $.extend(_public, testMethods);
        }

        // Cache UI selectors
        _ui.loginFormDialog = $('#login-form-dialog');
        _ui.loginForm = $('#login-form');
        _ui.container = $('#container');
        _ui.controls = $('#controls');
        _ui.modal = $('#modal');
        _ui.modalContent = $('#modal-content');
        _ui.newButton = $('#new');
        _ui.adminButton = $('#admin');
        _ui.clearSearchButton = $('#clear-search');
        _ui.searchInput = $('#search');
        _ui.spinner = $('#spinner');

        _templates.urlLink = Handlebars.compile($('#tmpl-urllink').html());
        _templates.urlText = Handlebars.compile($('#tmpl-urltext').html());
        _templates.detail = Handlebars.compile($('#tmpl-detail').html());
        _templates.credentialForm = Handlebars.compile($('#tmpl-credentialform').html());
        _templates.deleteConfirmationDialog = Handlebars.compile($('#tmpl-deleteconfirmationdialog').html());
        _templates.optionsDialog = Handlebars.compile($('#tmpl-optionsdialog').html());
        _templates.exportedDataWindow = Handlebars.compile($('#tmpl-exporteddatawindow').html());
        _templates.credentialTable = Handlebars.compile($('#tmpl-credentialtable').html());
        _templates.credentialTableRow = Handlebars.compile($('#tmpl-credentialtablerow').html());
        _templates.validationMessage = Handlebars.compile($('#tmpl-validationmessage').html());
        _templates.modalHeader = Handlebars.compile($('#tmpl-modalheader').html());
        _templates.modalBody = Handlebars.compile($('#tmpl-modalbody').html());
        _templates.modalFooter = Handlebars.compile($('#tmpl-modalfooter').html());
        _templates.copyLink = Handlebars.compile($('#tmpl-copylink').html());

        Handlebars.registerPartial('credentialtablerow', _templates.credentialTableRow);

        Handlebars.registerPartial('copylink', _templates.copyLink);

        Handlebars.registerHelper('breaklines', function (text: string): hbs.SafeString {
            text = Handlebars.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, '<br />');
            return new Handlebars.SafeString(text);
        });

        Handlebars.registerHelper('truncate', function (text: string, size: number): hbs.SafeString {
            text = text.length > size ? text.substring(0, size - 3) + '...' : text;
            text = Handlebars.Utils.escapeExpression(text);
            return new Handlebars.SafeString(text);
        });

        // Don't set up event handlers in test mode
        if (!testMode) {
            _ui.container.on('click', '.btn-credential-show-detail', function (e: Event): void {
                e.preventDefault();
                let id: string = $(this).parent().parent().attr('id');
                _showDetail(id, _masterKey);
            });

            _ui.newButton.on('click', function (e: Event): void {
                e.preventDefault();
                _loadCredential(null, _masterKey);
            });

            _ui.adminButton.on('click', function (e: Event): void {
                e.preventDefault();
                _options();
            });

            _ui.clearSearchButton.on('click', function (e: Event): void {
                e.preventDefault();
                let results: Credential[] = _search(null, _cachedList);
                _buildDataTable(results, function (rows: CredentialSummary[]): void {
                    _ui.container.html(_createCredentialTable(rows));
                }, _masterKey, _userId);
                _ui.searchInput.val('').focus();
            });

            _ui.searchInput.on('keyup', _debounce(function (): void {
                let results: Credential[] = _search(this.value, _cachedList);
                _buildDataTable(results, function (rows: CredentialSummary[]): void {
                    _ui.container.html(_createCredentialTable(rows));
                }, _masterKey, _userId);
            }, 200));

            // Initialise globals and load data on correct login
            _ui.loginForm.on('submit', function (e: Event): void {
                e.preventDefault();

                let username: string = _ui.loginForm.find('#UN1209').val(),
                    password: string = _ui.loginForm.find('#PW9804').val();

                _ajaxPost(_basePath + 'Main/Login', {
                    UN1209: Passpack.utils.hashx(username),
                    PW9804: Passpack.utils.hashx(password)
                }, function (data: any): void {
                    // If the details were valid
                    if (data.result === 1 && data.id !== '') {
                        // Set some private variables so that we can reuse them for encryption during this session
                        _userId = data.id;
                        _password = password;
                        _masterKey = _utf8_to_b64(_createMasterKey(_password));

                        _loadCredentials(_userId, _masterKey, function (): void {
                            // Successfully logged in. Hide the login form
                            _ui.loginForm.hide();
                            _ui.loginFormDialog.modal('hide');
                            _ui.controls.show();
                            _ui.searchInput.focus();
                        });
                    }
                });
            });

            // Save the new details on edit form submit
            $('body').on('submit', '#credential-form', function (e: Event): void {
                e.preventDefault();

                let form: JQuery = $(this),
                    errors: any[] = [],
                    errorMsg: string[] = [],
                    credential: Credential = null,
                    properties: any = {};

                $('#validation-message').remove();
                form.find('div.has-error').removeClass('has-error');

                errors = _validateRecord(form);

                if (errors.length > 0) {
                    errors.forEach(function (error: any): void {
                        errorMsg.push(error.msg);
                        error.field.parent().parent().addClass('has-error');
                    });

                    _ui.modal.find('div.modal-body').prepend(_templates.validationMessage({ errors: errorMsg.join('<br />') }));
                    return;
                }

                // Serialize the form inputs into an object
                form.find('input[class!=submit], textarea').each(function (): void {
                    credential[this.name] = $(this).val();
                });

                // Hold the modified properties so we can update the list if the update succeeds
                properties = {
                    Description: form.find('#Description').val(),
                    Username: form.find('#Username').val(),
                    Password: form.find('#Password').val(),
                    Url: form.find('#Url').val()
                };

                // CredentialID and UserID are not currently encrypted so don't try to decode them
                credential = _encryptObject(credential, _masterKey, ['CredentialID', 'UserID']);

                _ajaxPost(_basePath + 'Main/Update', credential, function (data: Credential): void {
                    // Update the cached credential list with the new property values, so it is correct when we rebuild
                    _updateProperties(data.CredentialID, properties, _userId, _cachedList);
                    // Re-sort the list in case the order should change
                    _sortCredentials(_cachedList);
                    // For now we just reload the entire table in the background
                    _loadCredentials(_userId, _masterKey, function (): void {
                        let results: Credential[] = _search(_ui.searchInput.val(), _cachedList);
                        _ui.modal.modal('hide');
                        _buildDataTable(results, function (rows: CredentialSummary[]): void {
                            _ui.container.html(_createCredentialTable(rows));
                        }, _masterKey, _userId);
                    });
                });

                return;
            });

            // Show password strength as it is typed
            $('body').on('keyup', '#Password', _debounce(function (): void {
                _showPasswordStrength($(this));
            }));

            // Generate a nice strong password
            $('body').on('click', 'button.generate-password', function (e: Event): void {
                e.preventDefault();
                let password: string = Passpack.utils.passGenerator(_getPasswordGenerationOptions(), _getPasswordLength());
                $('#Password').val(password);
                $('#PasswordConfirmation').val(password);
                let opts: any[] = [$('#len').val(),
                                   _isChecked($('#ucase')) ? 1 : 0,
                                   _isChecked($('#lcase')) ? 1 : 0,
                                   _isChecked($('#nums')) ? 1 : 0,
                                   _isChecked($('#symb')) ? 1 : 0];
                $('#PwdOptions').val(opts.join('|'));
                _showPasswordStrength($('#Password'));
            });

            // Toggle password generation option UI visibility
            $('body').on('click', 'a.generate-password-options-toggle', function (e: Event): void {
                e.preventDefault();
                $('div.generate-password-options').toggle();
            });

            // Copy content to clipboard when copy icon is clicked
            $('body').on('click', 'a.copy-link', function (e: Event): void {
                e.preventDefault();
                let a: JQuery = $(this);
                $('a.copy-link').find('span').removeClass('copied').addClass('fa-clone').removeClass('fa-check-square');
                a.next('input.copy-content').select();
                try {
                    if (document.execCommand("copy")) {
                        a.find('span').addClass('copied').removeClass('fa-clone').addClass('fa-check-square');
                    }
                } catch (ex) {
                    window.alert('Copy operation is not supported by the current browser: ' + ex.message);
                }

            });

            $('body').on('click', 'button.btn-credential-open', function (e: Event): void {
                e.preventDefault();
                window.open($(this).data('url'));
            });

            $('body').on('click', 'button.btn-credential-copy', function (e: Event): void {
                e.preventDefault();
                let allButtons: JQuery = $('button.btn-credential-copy'),
                    button: JQuery = $(this);
                allButtons.removeClass('btn-success').addClass('btn-primary');
                allButtons.find('span').addClass('fa-clone').removeClass('fa-check-square');
                button.next('input.copy-content').select();
                try {
                    if (document.execCommand("copy")) {
                        button.addClass('btn-success').removeClass('btn-primary');
                        button.find('span').removeClass('fa-clone').addClass('fa-check-square');
                    }
                } catch (ex) {
                    window.alert('Copy operation is not supported by the current browser: ' + ex.message);
                }
            });

            // Automatically focus the search field if a key is pressed from the credential list
            $('body').on('keydown', function (e: Event): void {
                let event: KeyboardEvent = e as KeyboardEvent;
                let eventTarget: HTMLElement = e.target as HTMLElement;
                if (eventTarget.nodeName === 'BODY') {
                    e.preventDefault();
                    // Cancel the first mouseup event which will be fired after focus
                    _ui.searchInput.one('mouseup', function (me: Event): void {
                        me.preventDefault();
                    });
                    _ui.searchInput.focus();
                    let char: string = String.fromCharCode(event.keyCode);
                    if (/[a-zA-Z0-9]/.test(char)) {
                        _ui.searchInput.val(event.shiftKey ? char : char.toLowerCase());
                    } else {
                        _ui.searchInput.select();
                    }
                }
            });

            // If we're in dev mode, automatically log in with a cookie manually created on the dev machine
            if (devMode) {
                _ui.loginForm.find('#UN1209').val(Cookies.get('vault-dev-username'));
                _ui.loginForm.find('#PW9804').val(Cookies.get('vault-dev-password'));
                _ui.loginForm.submit();
            } else {
                _ui.loginForm.find('#UN1209').focus();
            }
        }
    }

    _public = {
        init: _init,
        changePassword: _changePassword,
        exportData: _exportData,
        importData: _importData
    };

    // Expose public methods
    return _public;

}(jQuery, Passpack, Handlebars, Cookies, window, document));
