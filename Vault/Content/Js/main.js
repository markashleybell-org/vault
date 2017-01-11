/// <reference path="types/bootstrap.d.ts" />
/// <reference path="types/jquery.d.ts" />
/// <reference path="types/passpack.d.ts" />
/// <reference path="types/handlebars.d.ts" />
/// <reference path="types/js.cookie.d.ts" />
/// <reference path="types/vault.d.ts" />
/* tslint:disable */
var Vault = (function ($, Passpack, Handlebars, Cookies, window, document) {
    'use strict';
    /* tslint:enable */
    /* tslint:disable:comment-format quotemark */
    var _weakPasswordThreshold = 40, // Bit value below which password is deemed weak
    _artificialAjaxDelay = false; // Introduce an artificial delay for AJAX calls so we can test loaders locally
    var _userId = '', // GUID identifying logged-in user
    _password = '', // Current user's password
    _masterKey = '', // Master key for Passpack encryption (Base64 encoded hash of (password + hashed pasword))
    _cachedList = [], // Hold the credential summary list in memory to avoid requerying/decrypting after save
    _basePath = null, // Base URL (used mostly for XHR requests, particularly when app is hosted as a sub-application)
    _public = {}, // Public function container
    // A map of the properties which can be searched for using the fieldName:query syntax
    // We need this because the search is not case-sensitive, whereas JS properties are!
    _queryablePropertyMap = {
        description: 'Description',
        username: 'Username',
        password: 'Password',
        url: 'Url',
        filter: 'FILTER'
    }, _ui = {
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
    }, _templates = {
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
    function _crypt(action, obj, masterKey, excludes) {
        var newCredential = {};
        Object.keys(obj).forEach(function (k) {
            if (excludes.indexOf(k) === -1) {
                newCredential[k] = action('AES', obj[k], _b64_to_utf8(masterKey));
            }
            else {
                newCredential[k] = obj[k];
            }
        });
        return newCredential;
    }
    function _encryptObject(obj, masterKey, excludes) {
        return _crypt(Passpack.encode, obj, masterKey, excludes);
    }
    function _decryptObject(obj, masterKey, excludes) {
        return _crypt(Passpack.decode, obj, masterKey, excludes);
    }
    function _createMasterKey(password) {
        return Passpack.utils.hashx(password + Passpack.utils.hashx(password, true, true), true, true);
    }
    // Remove the item with a specific ID from an array
    function _removeFromList(id, list) {
        list.forEach(function (item, i) {
            if (item.CredentialID === id) {
                list.splice(i, 1);
            }
        });
    }
    // Update properties of the item with a specific ID in a list
    function _updateProperties(id, properties, userId, list) {
        var items = list.filter(function (item) {
            return item.CredentialID === id;
        });
        // If an item with the ID already exists
        if (items.length) {
            // Map the property values to it
            $.extend(items[0], properties);
        }
        else {
            // If we didn't find an existing item, add a new item with the supplied property values
            list.push($.extend({ CredentialID: id, UserID: userId }, properties));
        }
    }
    function _defaultAjaxErrorCallback(ignore, status, error) {
        return window.alert('Http Error: ' + status + ' - ' + error);
    }
    function _ajaxPost(url, data, successCallback, errorCallback, contentType) {
        _ui.spinner.show();
        if (!errorCallback) {
            errorCallback = _defaultAjaxErrorCallback;
        }
        var options = {
            url: url,
            data: data,
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) {
                _ui.spinner.hide();
                successCallback(data, status, request);
            },
            error: function (request, status, error) {
                _ui.spinner.hide();
                errorCallback(request, status, error);
            }
        };
        if (contentType) {
            options.contentType = contentType;
        }
        if (!_artificialAjaxDelay) {
            $.ajax(options);
        }
        else {
            window.setTimeout(function () {
                $.ajax(options);
            }, 2000);
        }
    }
    // Load all records for a specific user
    function _loadCredentials(userId, masterKey, callback) {
        if (_cachedList !== null && _cachedList.length) {
            _buildDataTable(_cachedList, callback, masterKey, userId);
        }
        else {
            _ajaxPost(_basePath + 'Main/GetAll', { userId: userId }, function (data) {
                // At this point we only actually need to decrypt a few things for display/search
                // which speeds up client-side table construction time dramatically
                var items = data.map(function (item) {
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
    function _showDetail(credentialId, masterKey) {
        _ajaxPost(_basePath + 'Main/Load', { id: credentialId }, function (data) {
            // CredentialID and UserID are not currently encrypted so don't try to decode them
            data = _decryptObject(data, masterKey, ['CredentialID', 'UserID']);
            // Slightly convoluted, but basically don't link up the URL if it doesn't contain a protocol
            var urlText = _templates.urlText({ Url: data.Url });
            var urlHtml = data.Url.indexOf('//') === -1 ? urlText : _templates.urlLink({ Url: data.Url, UrlText: urlText });
            var detailHtml = _templates.detail({
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
                onedit: function () { _loadCredential($(this).data('credentialid'), masterKey); },
                ondelete: function () { _confirmDelete($(this).data('credentialid'), masterKey); }
            });
        });
    }
    // Default action for modal accept button
    function _defaultAcceptAction(e) {
        e.preventDefault();
        _ui.modal.modal('hide');
    }
    // Default action for modal close button
    function _defaultCloseAction(e) {
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
    function _showModal(options) {
        var showAccept = options.showAccept || false, showClose = options.showClose || true, showEdit = options.showEdit || false, showDelete = options.showDelete || false, html = _templates.modalHeader({
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
        _ui.modal.on('click', 'button.btn-edit', options.onedit || function () { window.alert('NOT BOUND'); });
        _ui.modal.on('click', 'button.btn-delete', options.ondelete || function () { window.alert('NOT BOUND'); });
        _ui.modal.modal();
    }
    function _getPasswordLength() {
        var len = parseInt($('#len').val(), 10);
        return isNaN(len) ? 16 : len;
    }
    function _getPasswordGenerationOptions() {
        var options = {};
        $('input.generate-password-option').each(function () {
            var checkbox = $(this);
            if (_isChecked(checkbox)) {
                options[checkbox.attr('name')] = 1;
            }
        });
        return options;
    }
    function _isChecked(el) {
        return el[0].checked;
    }
    function _checkIf(el, condition) {
        el[0].checked = condition();
    }
    // Load a record into the edit form
    // If null is passed as the credentialId, we set up the form for adding a new record
    function _loadCredential(credentialId, masterKey) {
        if (credentialId !== null) {
            _ajaxPost(_basePath + 'Main/Load', { id: credentialId }, function (data) {
                // CredentialID and UserID are not currently encrypted so don't try to decode them
                data = _decryptObject(data, masterKey, ['CredentialID', 'UserID']);
                _showModal({
                    title: 'Edit Credential',
                    content: _templates.credentialForm(data),
                    showAccept: true,
                    acceptText: 'Save',
                    onaccept: function () {
                        $('#credential-form').submit();
                    }
                });
                _ui.modal.find('#Description').focus();
                _showPasswordStrength(_ui.modal.find('#Password'));
                _setPasswordOptions(_ui.modal, data.PwdOptions);
            });
        }
        else {
            _showModal({
                title: 'Add Credential',
                content: _templates.credentialForm({ UserID: _userId }),
                showAccept: true,
                acceptText: 'Save',
                onaccept: function () {
                    $('#credential-form').submit();
                }
            });
            _ui.modal.find('#Description').focus();
            _showPasswordStrength(_ui.modal.find('#Password'));
        }
    }
    // Delete a record
    function _deleteCredential(credentialId, userId, masterKey) {
        _ajaxPost(_basePath + 'Main/Delete', { credentialId: credentialId, userId: userId }, function (data) {
            if (data.Success) {
                // Remove the deleted item from the cached list before reload
                _removeFromList(credentialId, _cachedList);
                // For now we just reload the entire table in the background
                _loadCredentials(userId, masterKey, function () {
                    _ui.modal.modal('hide');
                    var results = _search(_ui.searchInput.val(), _cachedList);
                    _buildDataTable(results, function (rows) {
                        _ui.container.html(_createCredentialTable(rows));
                    }, _masterKey, userId);
                });
            }
        });
    }
    // Show delete confirmation dialog
    function _confirmDelete(id, masterKey) {
        _showModal({
            title: 'Delete Credential',
            content: _templates.deleteConfirmationDialog(),
            showDelete: true,
            deleteText: 'Yes, Delete This Credential',
            ondelete: function (e) {
                e.preventDefault();
                _deleteCredential(id, _userId, masterKey);
            }
        });
    }
    // Generate standard hash for a password
    function _generatePasswordHash(password) {
        return Passpack.utils.hashx(password);
    }
    // Generate 64-bit hash for a password
    function _generatePasswordHash64(password) {
        // The hash is now a full 64 char string
        return Passpack.utils.hashx(password, false, true);
    }
    // Change the password and re-encrypt all credentials with the new password
    function _changePassword(userId, masterKey) {
        var newPassword = $('#NewPassword').val(), newPasswordConfirm = $('#NewPasswordConfirm').val(), confirmationMsg = 'When the password change is complete you will be logged out and will need to log back in.\n\n'
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
        var newPasswordHash = Passpack.utils.hashx(newPassword), newMasterKey = _utf8_to_b64(_createMasterKey(newPassword));
        // Get all the credentials, decrypt each with the old password
        // and re-encrypt it with the new one
        _ajaxPost(_basePath + 'Main/GetAllComplete', { userId: userId }, function (data) {
            var excludes = ['CredentialID', 'UserID', 'PasswordConfirmation'];
            var newData = data.map(function (item) {
                return _encryptObject(_decryptObject(item, _b64_to_utf8(masterKey), excludes), newMasterKey, excludes);
            });
            _ajaxPost(_basePath + 'Main/UpdateMultiple', JSON.stringify(newData), function () {
                // Store the new password in hashed form
                _ajaxPost(_basePath + 'Main/UpdatePassword', {
                    newHash: newPasswordHash,
                    userid: userId,
                    oldHash: Passpack.utils.hashx(_password)
                }, function () {
                    // Just reload the whole page when we're done to force login
                    window.location.href = _basePath.length > 1 ? _basePath.slice(0, -1) : _basePath;
                });
            }, null, 'application/json; charset=utf-8');
        });
    }
    // Export all credential data as JSON
    function _exportData(userId, masterKey) {
        // Get all the credentials, decrypt each one
        _ajaxPost(_basePath + 'Main/GetAllComplete', { userId: userId }, function (data) {
            var exportItems = data.map(function (item) {
                var o = _decryptObject(item, _b64_to_utf8(masterKey), ['CredentialID', 'UserID', 'PasswordConfirmation']);
                delete o.PasswordConfirmation; // Remove the password confirmation as it's not needed for export
                return o;
            });
            var exportWindow = window.open('', 'EXPORT_WINDOW', 'WIDTH=700, HEIGHT=600');
            if (exportWindow && exportWindow.top) {
                exportWindow.document.write(_templates.exportedDataWindow({ json: JSON.stringify(exportItems, undefined, 4) }));
            }
            else {
                window.alert('The export feature works by opening a popup window, but our popup window was blocked by your browser.');
            }
        });
    }
    // Import unencrypted JSON credential data
    function _importData(userId, masterKey, rawData) {
        var jsonImportData = JSON.parse(rawData);
        var excludes = ['CredentialID', 'UserID'];
        var newData = jsonImportData.map(function (item) {
            // Remove the confirmation property
            delete item.PasswordConfirmation;
            // Null out the old credential ID so UpdateMultiple knows this is a new record
            item.CredentialID = null;
            // Set the user ID to the ID of the new (logged in) user
            item.UserID = userId;
            return _encryptObject(item, _b64_to_utf8(masterKey), excludes);
        });
        _ajaxPost(_basePath + 'Main/UpdateMultiple', JSON.stringify(newData), function () {
            // Just reload the whole page when we're done to force login
            window.location.href = _basePath.length > 1 ? _basePath.slice(0, -1) : _basePath;
        }, null, 'application/json; charset=utf-8');
    }
    // Show the options dialog
    function _options() {
        var dialogHtml = _templates.optionsDialog({
            userid: _userId,
            masterkey: _utf8_to_b64(_masterKey)
        });
        _showModal({
            title: 'Admin',
            content: dialogHtml
        });
    }
    // Build the data table
    function _buildDataTable(data, callback, masterKey, userId) {
        // Create a table row for each record and add it to the rows array
        var rows = data.map(function (item) {
            return _createCredentialDisplayData(item, masterKey, userId);
        });
        // Fire the callback and pass it the array of rows
        callback(rows);
    }
    // Create the credential table
    function _createCredentialTable(rows) {
        return _templates.credentialTable({ rows: rows });
    }
    // Create a single table row for a credential
    function _createCredentialDisplayData(credential, masterKey, userId) {
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
    function _validateRecord(f) {
        var errors = [], description = f.find('#Description'), password = f.find('#Password'), passwordConfirmation = f.find('#PasswordConfirmation');
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
    function _utf8_to_b64(str) {
        return window.btoa(encodeURIComponent(escape(str)));
    }
    // Decode Base64 string
    function _b64_to_utf8(str) {
        return unescape(decodeURIComponent(window.atob(str)));
    }
    // Truncate a string at a specified length
    function _truncate(str, len) {
        return str.length > len ? str.substring(0, len - 3) + '...' : str;
    }
    // Hide credential rows which don't contain a particular string
    function _search(query, list) {
        var results = [], queryField, queryData;
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
                }
                else if (query === 'weak') {
                    results = list.filter(function (item) {
                        var pwd = item.Password;
                        return pwd && Passpack.utils.getBits(pwd) <= _weakPasswordThreshold;
                    });
                }
            }
            else {
                results = list.filter(function (item) {
                    return item[queryField].toLowerCase().indexOf(query) > -1;
                });
            }
        }
        return results;
    }
    // Rate-limit calls to the supplied function
    function _debounce(func, wait, immediate) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var later = function () {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            };
            var callNow = immediate && !timeout;
            window.clearTimeout(timeout);
            timeout = window.setTimeout(later, wait);
            if (callNow) {
                func.apply(context, args);
            }
        };
    }
    // Sort credentials alphabetically by description
    function _sortCredentials(credentials) {
        credentials.sort(function (a, b) {
            var desca = a.Description.toUpperCase(), descb = b.Description.toUpperCase();
            return desca < descb ? -1 : desca > descb ? 1 : 0;
        });
    }
    // Show password strength visually
    function _showPasswordStrength(field) {
        var strengthIndicator = field.next('div.password-strength'), status = strengthIndicator.find('> span'), bar = strengthIndicator.find('> div'), strength = Passpack.utils.getBits(field.val());
        bar.removeClass();
        if (strength === 0) {
            status.html('No Password');
            bar.css('width', 0);
        }
        else if (strength <= 100) {
            bar.css('width', strength + '%');
            if (strength <= 10) {
                bar.addClass('extremely-weak');
                status.html('Extremely Weak (' + strength + ')');
            }
            else if (strength <= 25) {
                bar.addClass('very-weak');
                status.html('Very Weak (' + strength + ')');
            }
            else if (strength <= _weakPasswordThreshold) {
                bar.addClass('weak');
                status.html('Weak (' + strength + ')');
            }
            else if (strength <= 55) {
                bar.addClass('average');
                status.html('Average (' + strength + ')');
            }
            else if (strength <= 75) {
                bar.addClass('strong');
                status.html('Strong (' + strength + ')');
            }
            else {
                bar.addClass('very-strong');
                status.html('Very Strong (' + strength + ')');
            }
        }
        else {
            bar.addClass('extremely-strong');
            status.html('Extremely Strong (' + strength + ')');
            bar.css('width', '100%');
        }
    }
    function _setPasswordOptions(form, opts) {
        var optArray = opts.split('|');
        form.find('[name=len]').val(optArray[0]);
        _checkIf(form.find('[name=ucase]'), function () { return optArray[1] === '1'; });
        _checkIf(form.find('[name=lcase]'), function () { return optArray[2] === '1'; });
        _checkIf(form.find('[name=nums]'), function () { return optArray[3] === '1'; });
        _checkIf(form.find('[name=symb]'), function () { return optArray[4] === '1'; });
    }
    // Initialise the app
    function _init(basePath, testMode, devMode) {
        // Set the base path for AJAX requests/redirects
        _basePath = basePath;
        // Determine whether we're testing or not
        if (testMode) {
            var testMethods = {
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
        Handlebars.registerHelper('breaklines', function (text) {
            text = Handlebars.Utils.escapeExpression(text);
            text = text.replace(/(\r\n|\n|\r)/gm, '<br />');
            return new Handlebars.SafeString(text);
        });
        Handlebars.registerHelper('truncate', function (text, size) {
            text = text.length > size ? text.substring(0, size - 3) + '...' : text;
            text = Handlebars.Utils.escapeExpression(text);
            return new Handlebars.SafeString(text);
        });
        // Don't set up event handlers in test mode
        if (!testMode) {
            _ui.container.on('click', '.btn-credential-show-detail', function (e) {
                e.preventDefault();
                var id = $(this).parent().parent().attr('id');
                _showDetail(id, _masterKey);
            });
            _ui.newButton.on('click', function (e) {
                e.preventDefault();
                _loadCredential(null, _masterKey);
            });
            _ui.adminButton.on('click', function (e) {
                e.preventDefault();
                _options();
            });
            _ui.clearSearchButton.on('click', function (e) {
                e.preventDefault();
                var results = _search(null, _cachedList);
                _buildDataTable(results, function (rows) {
                    _ui.container.html(_createCredentialTable(rows));
                }, _masterKey, _userId);
                _ui.searchInput.val('').focus();
            });
            _ui.searchInput.on('keyup', _debounce(function () {
                var results = _search(this.value, _cachedList);
                _buildDataTable(results, function (rows) {
                    _ui.container.html(_createCredentialTable(rows));
                }, _masterKey, _userId);
            }, 200));
            // Initialise globals and load data on correct login
            _ui.loginForm.on('submit', function (e) {
                e.preventDefault();
                var username = _ui.loginForm.find('#UN1209').val(), password = _ui.loginForm.find('#PW9804').val();
                _ajaxPost(_basePath + 'Main/Login', {
                    UN1209: Passpack.utils.hashx(username),
                    PW9804: Passpack.utils.hashx(password)
                }, function (data) {
                    // If the details were valid
                    if (data.result === 1 && data.id !== '') {
                        // Set some private variables so that we can reuse them for encryption during this session
                        _userId = data.id;
                        _password = password;
                        _masterKey = _utf8_to_b64(_createMasterKey(_password));
                        _loadCredentials(_userId, _masterKey, function () {
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
            $('body').on('submit', '#credential-form', function (e) {
                e.preventDefault();
                var form = $(this), errors = [], errorMsg = [], credential = null, properties = {};
                $('#validation-message').remove();
                form.find('div.has-error').removeClass('has-error');
                errors = _validateRecord(form);
                if (errors.length > 0) {
                    errors.forEach(function (error) {
                        errorMsg.push(error.msg);
                        error.field.parent().parent().addClass('has-error');
                    });
                    _ui.modal.find('div.modal-body').prepend(_templates.validationMessage({ errors: errorMsg.join('<br />') }));
                    return;
                }
                // Serialize the form inputs into an object
                form.find('input[class!=submit], textarea').each(function () {
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
                _ajaxPost(_basePath + 'Main/Update', credential, function (data) {
                    // Update the cached credential list with the new property values, so it is correct when we rebuild
                    _updateProperties(data.CredentialID, properties, _userId, _cachedList);
                    // Re-sort the list in case the order should change
                    _sortCredentials(_cachedList);
                    // For now we just reload the entire table in the background
                    _loadCredentials(_userId, _masterKey, function () {
                        var results = _search(_ui.searchInput.val(), _cachedList);
                        _ui.modal.modal('hide');
                        _buildDataTable(results, function (rows) {
                            _ui.container.html(_createCredentialTable(rows));
                        }, _masterKey, _userId);
                    });
                });
                return;
            });
            // Show password strength as it is typed
            $('body').on('keyup', '#Password', _debounce(function () {
                _showPasswordStrength($(this));
            }));
            // Generate a nice strong password
            $('body').on('click', 'button.generate-password', function (e) {
                e.preventDefault();
                var password = Passpack.utils.passGenerator(_getPasswordGenerationOptions(), _getPasswordLength());
                $('#Password').val(password);
                $('#PasswordConfirmation').val(password);
                var opts = [$('#len').val(),
                    _isChecked($('#ucase')) ? 1 : 0,
                    _isChecked($('#lcase')) ? 1 : 0,
                    _isChecked($('#nums')) ? 1 : 0,
                    _isChecked($('#symb')) ? 1 : 0];
                $('#PwdOptions').val(opts.join('|'));
                _showPasswordStrength($('#Password'));
            });
            // Toggle password generation option UI visibility
            $('body').on('click', 'a.generate-password-options-toggle', function (e) {
                e.preventDefault();
                $('div.generate-password-options').toggle();
            });
            // Copy content to clipboard when copy icon is clicked
            $('body').on('click', 'a.copy-link', function (e) {
                e.preventDefault();
                var a = $(this);
                $('a.copy-link').find('span').removeClass('copied').addClass('fa-clone').removeClass('fa-check-square');
                a.next('input.copy-content').select();
                try {
                    if (document.execCommand("copy")) {
                        a.find('span').addClass('copied').removeClass('fa-clone').addClass('fa-check-square');
                    }
                }
                catch (ex) {
                    window.alert('Copy operation is not supported by the current browser: ' + ex.message);
                }
            });
            $('body').on('click', 'button.btn-credential-open', function (e) {
                e.preventDefault();
                window.open($(this).data('url'));
            });
            $('body').on('click', 'button.btn-credential-copy', function (e) {
                e.preventDefault();
                var allButtons = $('button.btn-credential-copy'), button = $(this);
                allButtons.removeClass('btn-success').addClass('btn-primary');
                allButtons.find('span').addClass('fa-clone').removeClass('fa-check-square');
                button.next('input.copy-content').select();
                try {
                    if (document.execCommand("copy")) {
                        button.addClass('btn-success').removeClass('btn-primary');
                        button.find('span').removeClass('fa-clone').addClass('fa-check-square');
                    }
                }
                catch (ex) {
                    window.alert('Copy operation is not supported by the current browser: ' + ex.message);
                }
            });
            // Automatically focus the search field if a key is pressed from the credential list
            $('body').on('keydown', function (e) {
                var event = e;
                var eventTarget = e.target;
                if (eventTarget.nodeName === 'BODY') {
                    e.preventDefault();
                    // Cancel the first mouseup event which will be fired after focus
                    _ui.searchInput.one('mouseup', function (me) {
                        me.preventDefault();
                    });
                    _ui.searchInput.focus();
                    var char = String.fromCharCode(event.keyCode);
                    if (/[a-zA-Z0-9]/.test(char)) {
                        _ui.searchInput.val(event.shiftKey ? char : char.toLowerCase());
                    }
                    else {
                        _ui.searchInput.select();
                    }
                }
            });
            // If we're in dev mode, automatically log in with a cookie manually created on the dev machine
            if (devMode) {
                _ui.loginForm.find('#UN1209').val(Cookies.get('vault-dev-username'));
                _ui.loginForm.find('#PW9804').val(Cookies.get('vault-dev-password'));
                _ui.loginForm.submit();
            }
            else {
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
