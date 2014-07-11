//////////////////////////////////////////////////////////////////////////////////
// Vault client app code
//////////////////////////////////////////////////////////////////////////////////

var Vault = (function ($) {
    // Private member variables
    var _userId = '', // GUID identifying logged-in user
    _username = '', // Current user's username
    _password = '', // Current user's password
    _masterKey = '', // Master key for Passpack encryption (Base64 encoded hash of (password + hashed pasword))
    _test = false, // Determine whether to expose all methods publically
    _dataTable = null, // Cache DataTable in memory
    _dataTableOptions = {
        'bJQueryUI': true,
        'sPaginationType': 'full_numbers',
        'bAutoWidth': false,
        'bLengthChange': false,
        'iDisplayLength': 20,
        'sScrollY': 441,
        'aaSorting': [[0, 'asc']],
        'aoColumns': [
            { 'sType': 'html' },
            { 'sTitle': '', 'sWidth': 20, 'bSortable': false },
            { 'sTitle': '', 'sWidth': 20, 'bSortable': false },
            { 'sTitle': '', 'sWidth': 20, 'bSortable': false }
        ]
    },
    _cachedList = [], // Hold the list of credential summaries in memory to avoid requerying and decrypting after each save
    _ui = {
        modalBackground: null,
        loginFormDialog: null,
        credentialFormDialog: null,
        loginForm: null,
        credentialForm: null,
        container: null,
        spinner: null,
        recordsFilter: null,
        modalDialog: null,
        records: null
    },
    _templates = {
        copyLink: null,
        detail: null,
        addLink: null,
        clearFilterButton: null,
        deleteConfirmationDialog: null,
        spinner: null,
        optionsDialog: null,
        exportedDataWindow: null,
        credentialTable: null,
        credentialTableRow: null,
        validationMessage: null
    };

    // Insert the Flash-based 'Copy To Clipboard' icon next to credentials
    var _insertCopyLink = function (text) {
        return _templates.copyLink({ text: encodeURIComponent(text) });
    };

    // Insert an AJAX spinner GIF and cache the element selector
    var _insertSpinner = function () {
        var spinner = $(_templates.spinner());
        _ui.spinner = spinner;
        return spinner;
    };

    // Use jQuery's tried and tested code to convert plain text to HTML-encoded text
    var _htmlEncode = function (value) {
        return $('<div/>').text(value).html();
    };

    // Do the same to convert HTML-encoded text to plain text
    var _htmlDecode = function (value) {
        return $('<div/>').html(value).text();
    };

    // Encrypt the properties of an object literal using Passpack
    // excludes is an array of property names whose values should not be encrypted
    var _encryptObject = function (obj, masterKey, excludes) {
        for (var p in obj) {
            if (!_contains(excludes, p)) {
                obj[p] = Passpack.encode('AES', obj[p], _b64_to_utf8(masterKey));
            }
        }
        return obj;
    };

    // Encrypt the properties of an object literal using Passpack
    // excludes is an array of property names whose values should not be encrypted
    var _decryptObject = function (obj, masterKey, excludes) {
        for (var p in obj) {
            if (!_contains(excludes, p)) {
                obj[p] = Passpack.decode('AES', obj[p], _b64_to_utf8(masterKey));
            }
        }
        return obj;
    };

    // Remove the item with a specific ID from an array
    var _removeFromList = function (id, list) {
        var i;

        for (i = 0; i < list.length; i++) {
            if (list[i].CredentialID == id) {
                break;
            }
        }

        list.splice(i, 1);
    };

    // Update the description of item with a specific ID in a list
    var _updateDescription = function (id, description, userId, list) {

        for (var i = 0; i < list.length; i++) {
            if (list[i].CredentialID == id) {
                list[i].Description = description;
                return;
            }
        }

        list.push({ CredentialID: id, Description: description, UserID: userId });
    };

    var _defaultAjaxErrorCallback = function (request, status, error) {
        alert('Http Error: ' + status + ' - ' + error);
    };

    var _ajaxPost = function (url, data, successCallback, errorCallback, contentType) {
        if (typeof errorCallback === 'undefined' || errorCallback === null) {
            errorCallback = _defaultAjaxErrorCallback;
        }
        var options = {
            url: url,
            data: data,
            dataType: 'json',
            type: 'POST',
            success: successCallback,
            error: errorCallback
        };

        if(typeof contentType !== 'undefined')
        {
            options.contentType = contentType;
        }

        $.ajax(options);
    };

    // Load all records for a specific user
    var _loadCredentials = function (userId, masterKey, callback) {

        if (_cachedList != null && _cachedList.length) {

            _buildDataTable(_cachedList, callback, masterKey);

        } else {

            _ajaxPost('/Main/GetAll', { userId: userId }, function (data, status, request) {

                var items = [];
                // At this point we only actually need to decrypt Description for display,
                // which speeds up client-side table construction time dramatically
                var excludes = ['CredentialID', 'UserID'];

                $.each(data, function (i, item) {
                    items.push(_decryptObject(item, masterKey, excludes));
                });

                // Cache the whole (decrypted) list on the client
                _cachedList = items;
                _buildDataTable(_cachedList, callback, masterKey);

            });

        }

    };

    // Show the read-only details dialog
    var _showDetail = function (credentialId, masterKey) {

        _ajaxPost('/Main/Load', { id: credentialId }, function (data, status, request) {

            // CredentialID and UserID are not currently encrypted so don't try to decode them
            var excludeProperties = ['CredentialID', 'UserID'];

            data = _decryptObject(data, masterKey, excludeProperties);

            // Loop through all the properties of the data object (except the excludes)
            // and encode any HTML for display
            $.each(data, function (name, value) {

                if (!_contains(excludeProperties, name) && name != 'Password') {
                    data[name] = _htmlEncode(value);
                }

            });

            var detailHtml = _templates.detail({
                Url: data.Url,
                Username: data.Username,
                UsernameCopyLink: _insertCopyLink(data.Username),
                Password: data.Password,
                PasswordCopyLink: _insertCopyLink(data.Password),
                UserDefined1: data.UserDefined1,
                UserDefined1Label: data.UserDefined1Label,
                UserDefined1CopyLink: _insertCopyLink(data.UserDefined1),
                UserDefined2: data.UserDefined2,
                UserDefined2Label: data.UserDefined2Label,
                UserDefined2CopyLink: _insertCopyLink(data.UserDefined2),
                Notes: data.Notes.replace(/\r\n|\n|\r/gi, '<br />')
            });

            _ui.modalDialog.html(detailHtml).dialog({ title: data.Description, width: 600, minHeight: 50, modal: true });

        });

    };

    // Load a record into the edit form
    // If null is passed as the credentialId, we set up the form for adding a new record
    var _loadCredential = function (credentialId, masterKey, userId) {

        if (credentialId != null) {

            _ajaxPost('/Main/Load', { id: credentialId }, function (data, status, request) {

                // CredentialID and UserID are not currently encrypted so don't try to decode them
                data = _decryptObject(data, masterKey, ['CredentialID', 'UserID']);

                var f = _ui.credentialForm;

                $('#CredentialID', f).val(data.CredentialID);
                $('#Description', f).val(data.Description);
                $('#Username', f).val(data.Username);
                $('#Password', f).val(data.Password);
                $('#PasswordConfirmation', f).val(data.PasswordConfirmation);
                $('#Url', f).val(data.Url);
                $('#UserDefined1Label', f).val(data.UserDefined1Label);
                $('#UserDefined1', f).val(data.UserDefined1);
                $('#UserDefined2Label', f).val(data.UserDefined2Label);
                $('#UserDefined2', f).val(data.UserDefined2);
                $('#Notes', f).val(data.Notes);
                $('#UserID', f).val(data.UserID);

                _ui.credentialFormDialog.dialog({ title: 'Edit Credential', width: 500, modal: true });

            });

        } else { // New record setup

            _ui.credentialFormDialog.find('input:not(.submit), textarea').val('');
            _ui.credentialForm.find('#UserID').val(userId);

            _ui.credentialFormDialog.dialog({ title: 'Edit Credential', width: 500, modal: true });

        }

    };

    // Delete a record
    var _deleteCredential = function (credentialId, userId, masterKey) {

        _ajaxPost('/Main/Delete', { credentialId: credentialId, userId: userId }, function (data, status, request) {

            if (data.Success) {

                // Completely destroy the existing DataTable and remove the table and add link from the DOM
                _dataTable.fnDestroy();
                $('#records, #add-link').remove();

                // Remove the deleted item from the cached list before reload
                _removeFromList(credentialId, _cachedList);

                // For now we just reload the entire table in the background
                _loadCredentials(userId, _b64_to_utf8(masterKey), function (rows) {

                    _ui.container.append(_createCredentialTable(rows));

                    _ui.records = $('#records');
                    _dataTable = _ui.records.dataTable(_dataTableOptions);

                    _ui.container.append(_templates.addLink({ masterkey: masterKey, userid: userId }));

                    _ui.modalDialog.dialog('destroy');

                    _ui.recordsFilter = $('#records_filter');

                    // Append the clear filter button
                    _ui.recordsFilter.before(_templates.clearFilterButton());

                    _ui.recordsFilter.find('input:last').focus();

                });

            }

        });

    };

    // Show delete confirmation dialog
    var _confirmDelete = function (id, userId) {

        var dialogHtml = _templates.deleteConfirmationDialog({
            id: id,
            userid: userId,
            masterkey: _utf8_to_b64(_masterKey)
        });

        _ui.modalDialog.html(dialogHtml).dialog({
            title: 'Delete Credential',
            width: 500,
            modal: true,
            minHeight: 50
        });

    };

    // Generate standard hash for a password
    var _generatePasswordHash = function (password) {
        return Passpack.utils.hashx(password);
    };

    // Generate 64-bit hash for a password
    var _generatePasswordHash64 = function (password) {
        // The hash is now a full 64 char string
        return Passpack.utils.hashx(password, false, true);
    };

    // Change the password and re-encrypt all credentials with the new password
    var _changePassword = function (userId, masterKey) {

        var newPassword = $('#NewPassword').val();
        var newPasswordConfirm = $('#NewPasswordConfirm').val();

        if (newPassword === '') {
            alert('Password cannot be left blank.');
            return false;
        }

        if (newPassword != newPasswordConfirm) {
            alert('Password confirmation does not match password.');
            return false;
        }

        if (!confirm('When the password change is complete you will be logged out and will need to log back in.\n\nAre you sure you want to change the master password?')) {
            return false;
        }

        var newPasswordHash = Passpack.utils.hashx(newPassword);
        // Convert the new master key to Base64 so that encryptObject() gets what it's expecting
        var newMasterKey = _utf8_to_b64(Passpack.utils.hashx(newPassword + Passpack.utils.hashx(newPassword, 1, 1), 1, 1));

        // Show a spinner until complete because this can take some time!
        $('#change-password-button').after(_insertSpinner());

        var newData = [];

        // Get all the credentials, decrypt each with the old password
        // and re-encrypt it with the new one
        _ajaxPost('/Main/GetAllComplete', { userId: userId }, function (data, status, request) {

            var excludes = ['CredentialID', 'UserID', 'PasswordConfirmation'];

            $.each(data, function (i, item) {

                newData.push(_encryptObject(_decryptObject(item, _b64_to_utf8(masterKey), excludes), newMasterKey, excludes));

            });

            _ajaxPost('/Main/UpdateMultiple', Passpack.JSON.stringify(newData), function (data, status, request) {

                // Store the new password in hashed form
                _ajaxPost('/Main/UpdatePassword', {
                    newHash: newPasswordHash,
                    userid: userId,
                    oldHash: Passpack.utils.hashx(_password)
                }, function (data, status, request) {

                    window.location.href = '/';

                });

            }, 'application/json; charset=utf-8');

        });

        return false;

    };

    // Export all credential data as JSON
    var _exportData = function (userId, masterKey) {

        // Show a spinner until complete because this can take some time!
        $('#export-button').after(_insertSpinner());

        var exportItems = [];

        // Get all the credentials, decrypt each one
        _ajaxPost('/Main/GetAllComplete', { userId: userId }, function (data, status, request) {

            var excludes = ['CredentialID', 'UserID', 'PasswordConfirmation'];

            $.each(data, function (i, item) {
                exportItems.push(_decryptObject(item, _b64_to_utf8(masterKey), excludes));
            });

            var exportWindow = window.open('', 'EXPORT_WINDOW', 'WIDTH=700, HEIGHT=600');

            if (exportWindow && exportWindow.top) {
                exportWindow.document.write(_templates.exportedDataWindow({ json: JSON.stringify(exportItems, undefined, 4) }));
            } else {
                alert('The export feature works by opening a popup window, but our popup window was blocked by your browser.');
            }

            _ui.spinner.remove();

        });

        return false;

    };

    // Show the options dialog
    var _options = function () {

        var dialogHtml = _templates.optionsDialog({
            userid: _userId,
            masterkey: _utf8_to_b64(_masterKey)
        });

        $('#modal-dialog').html(dialogHtml).dialog({
            title: 'Options',
            width: 500,
            modal: true,
            minHeight: 50
        });

    };

    // Build the data table
    var _buildDataTable = function (data, callback, masterKey) {
        var rows = [];

        // Create a table row for each record and add it to the rows array
        $.each(data, function (i, item) {
            rows.push(_createCredentialTableRow(item, masterKey));
        });

        // Fire the callback and pass it the array of rows
        callback(rows);
    };

    // Create the credential table
    var _createCredentialTable = function (rows) {

        return _templates.credentialTable({ rows: rows });

    };

    // Create a single table row for a credential
    var _createCredentialTableRow = function (credential, masterKey) {

        return {
            credentialid: credential.CredentialID,
            masterkey: masterKey,
            userid: _userId,
            description: credential.Description,
            url: credential.Url
        };

    };

    // Validate a credential record form
    var _validateRecord = function (f) {

        var errors = [];

        // $('#CredentialID', f).val(data.CredentialID);

        var description = $('#Description', f);
        var password = $('#Password', f);
        var passwordConfirmation = $('#PasswordConfirmation', f);

        if (description.val() == '') {
            errors.push({ field: description, msg: 'You must fill in a Description' });
        }

        // We don't mind if these are blank, but they must be the same!
        if (password.val() != passwordConfirmation.val()) {
            errors.push({ field: passwordConfirmation, msg: 'Password confirmation does not match' });
        }

        return errors;

    };

    // Encode string to Base64
    var _utf8_to_b64 = function (str) {
        return window.btoa(encodeURIComponent(window.escape(str)));
    };

    // Decode Base64 string
    var _b64_to_utf8 = function (str) {
        return window.unescape(decodeURIComponent(window.atob(str)));
    };

    // Utility function to check a value exists in an array
    var _contains = function (arr, value) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == value) {
                return true;
            }
        }
        return false;
    };

    // Truncate a string at a specified length
    var _truncate = function (str, len) {
        return (str.length > len) ? str.substring(0, (len - 3)) + '...' : str;
    };

    // Initialise the app
    var _init = function (test) {
        // Determine whether we're testing or not
        if (typeof test !== 'undefined' && test) {
            var testMethods = {
                insertCopyLink: _insertCopyLink,
                insertSpinner: _insertSpinner,
                htmlEncode: _htmlEncode,
                htmlDecode: _htmlDecode,
                encryptObject: _encryptObject,
                decryptObject: _decryptObject,
                removeFromList: _removeFromList,
                updateDescription: _updateDescription,
                loadCredentials: _loadCredentials,
                generatePasswordHash: _generatePasswordHash,
                generatePasswordHash64: _generatePasswordHash64,
                buildDataTable: _buildDataTable,
                createCredentialTable: _createCredentialTable,
                createCredentialTableRow: _createCredentialTableRow,
                validateRecord: _validateRecord,
                utf8_to_b64: _utf8_to_b64,
                b64_to_utf8: _b64_to_utf8,
                contains: _contains,
                truncate: _truncate
            };
            $.extend(vault, testMethods);
        }

        if (typeof test === 'undefined' || !test) {

            // Add the modal dialog container
            $('body').append('<div id="modal-dialog"></div>');
            // Cache UI selectors
            _ui.loginFormDialog = $('#login-form-dialog');
            _ui.credentialFormDialog = $('#credential-form-dialog');
            _ui.loginForm = $('#login-form');
            _ui.credentialForm = $('#credential-form');
            _ui.container = $('#container');
            _ui.spinner = $('#spinner');
            _ui.recordsFilter = $('#records_filter');
            _ui.modalDialog = $('#modal-dialog');

            _templates.copyLink = Handlebars.compile($('#tmpl-copylink').html());
            _templates.detail = Handlebars.compile($('#tmpl-detail').html());
            _templates.addLink = Handlebars.compile($('#tmpl-addlink').html());
            _templates.clearFilterButton = Handlebars.compile($('#tmpl-clearfilter').html());
            _templates.deleteConfirmationDialog = Handlebars.compile($('#tmpl-deleteconfirmationdialog').html());
            _templates.spinner = Handlebars.compile($('#tmpl-spinner').html());
            _templates.optionsDialog = Handlebars.compile($('#tmpl-optionsdialog').html());
            _templates.exportedDataWindow = Handlebars.compile($('#tmpl-exporteddatawindow').html());
            _templates.credentialTable = Handlebars.compile($('#tmpl-credentialtable').html());
            _templates.credentialTableRow = Handlebars.compile($('#tmpl-credentialtablerow').html());
            Handlebars.registerPartial('credentialtablerow', _templates.credentialTableRow);
            _templates.validationMessage = Handlebars.compile($('#tmpl-validationmessage').html());

            // Load the datatable stylesheet dynamically
            var tableStyles = $('<link rel="stylesheet" type="text/css" href="/content/css/datatables.css" />');
            $('head').append(tableStyles);

            // Initialise globals and load data on correct login
            _ui.loginForm.on('submit', function () {

                var username = _ui.loginForm.find('#Username').val();
                var password = _ui.loginForm.find('#Password').val();

                _ui.loginFormDialog.find('.submit').after(_insertSpinner());

                _ajaxPost('/Main/Login', {
                    Username: Passpack.utils.hashx(username),
                    Password: Passpack.utils.hashx(password)
                }, function (data, status, request) {

                    // If the details were valid
                    if (data.result == 1 && data.id != '') {

                        // Set some private variables so that we can reuse them for encryption during this session
                        _userId = data.id;
                        _username = username;
                        _password = password;
                        _masterKey = _utf8_to_b64(window.Passpack.utils.hashx(_password + Passpack.utils.hashx(_password, 1, 1), 1, 1));

                        _loadCredentials(_userId, _masterKey, function (rows) {

                            _ui.container.append(_createCredentialTable(rows));
                            // Cache the table selector
                            _ui.records = $('#records');
                            _dataTable = _ui.records.dataTable(_dataTableOptions);

                            // Successfully logged in. Hide the login form
                            _ui.container.append(_templates.addLink({ masterkey: _masterKey, userid: _userId }));
                            _ui.loginForm.hide();
                            _ui.loginFormDialog.dialog('destroy');

                            _ui.recordsFilter = $('#records_filter');

                            // Append the clear filter button
                            _ui.recordsFilter.before(_templates.clearFilterButton());

                            _ui.recordsFilter.find('input:last').focus();

                        });

                    }

                    _ui.spinner.remove();

                });

                return false;

            });

            // Save the new details on edit form submit
            _ui.credentialForm.on('submit', function () {
                var form = $(this);
                $('#validation-message').remove();
                var inputs = form.find('input[class!=submit], textarea');
                inputs.removeClass('invalid');

                var errors = _validateRecord(form);
                var errorMsg = [];

                if (errors.length > 0) {

                    for (var i = 0; i < errors.length; i++) {
                        errorMsg.push(errors[i].msg);
                        errors[i].field.addClass('invalid');
                    }

                    form.prepend(_templates.validationMessage({ errors: errorMsg.join('<br />') }));
                    return false;

                }

                form.find('.submit').after(_insertSpinner());

                var credential = {};

                // Serialize the form inputs into an object
                inputs.each(function () {
                    credential[this.name] = $(this).val();
                });

                // Hold the modified Description so we can update the list if the update succeeds
                var description = form.find('#Description').val();

                // CredentialID and UserID are not currently encrypted so don't try to decode them
                credential = _encryptObject(credential, _masterKey, ['CredentialID', 'UserID']);

                _ajaxPost('/Main/Update', credential, function (data, status, request) {

                    // Update the cached credential list with the new Description so it is correct when we rebuild
                    _updateDescription(data.CredentialID, description, _userId, _cachedList);

                    // Completely destroy the existing DataTable and remove the table and add link from the DOM
                    _dataTable.fnDestroy();
                    $('#records, #add-link').remove();

                    // For now we just reload the entire table in the background
                    _loadCredentials(_userId, _masterKey, function (rows) {

                        _ui.container.append(_createCredentialTable(rows));

                        _ui.records = $('#records');
                        _dataTable = _ui.records.dataTable(_dataTableOptions);

                        _ui.container.append(_templates.addLink({ masterkey: _masterKey, userid: _userId }));

                        _ui.spinner.remove();

                        _ui.credentialFormDialog.dialog('destroy');

                        _ui.recordsFilter = $('#records_filter');

                        // Append the clear filter button
                        _ui.recordsFilter.before(_templates.clearFilterButton());

                        _ui.recordsFilter.find('input:last').focus();

                    });

                });

                return false;

            });
        }
    };

    // Expose public methods
    var vault = {
        init: _init,
        showDetail: _showDetail,
        loadCredential: _loadCredential,
        confirmDelete: _confirmDelete,
        deleteCredential: _deleteCredential,
        options: _options,
        changePassword: _changePassword,
        exportData: _exportData
    };

    return vault;

}(jQuery));
