var Vault = (function ($) {

    function _insertCopyLink(text) {

        return '<span class="copy-link"><object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"' +
               '        width="14"' +
               '        height="14">' +
               '<param name="movie" value="/content/img/clippy.swf"/>' +
               '<param name="allowScriptAccess" value="always" />' +
               '<param name="quality" value="high" />' +
               '<param name="scale" value="noscale" />' +
               '<param name="FlashVars" value="text=' + encodeURIComponent(text) + '">' +
               '<param name="bgcolor" value="#ffffff">' +
               '<param name="wmode" value="opaque">' +
               '<embed src="/content/img/clippy.swf"' +
               '       width="14"' +
               '       height="14"' +
               '       wmode="opaque"' +
               '       name="clippy"' +
               '       quality="high"' +
               '       scale="noscale"' +
               '       allowScriptAccess="always"' +
               '       type="application/x-shockwave-flash"' +
               '       pluginspage="http://www.macromedia.com/go/getflashplayer"' +
               '       FlashVars="text=' + encodeURIComponent(text) + '"' +
               '       bgcolor="#ffffff"' +
               '/>' +
               '</object></span>';

    }

    function _htmlEncode(value) {
        return $('<div/>').text(value).html();
    }

    function _htmlDecode(value) {
        return $('<div/>').html(value).text();
    }

    // Encrypt the properties of an object literal using Passpack
    // excludes is an array of property names whose values should not be encrypted
    function _encryptObject(obj, masterKey, excludes) {
        for (var p in obj)
            if (!_contains(excludes, p))
                obj[p] = Passpack.encode('AES', obj[p], _b64_to_utf8(masterKey));
        return obj;
    }

    // Encrypt the properties of an object literal using Passpack
    // excludes is an array of property names whose values should not be encrypted
    function _decryptObject(obj, masterKey, excludes) {
        for (var p in obj)
            if (!_contains(excludes, p))
                obj[p] = Passpack.decode('AES', obj[p], _b64_to_utf8(masterKey));
        return obj;
    }

    function _removeFromList(id, list) {

        var i;

        for (i = 0; i < list.length; i++) {

            if (list[i].CredentialID == id) {

                break;

            }

        }

        list.splice(i, 1);

    }

    function _updateDescription(id, description, userId, list) {

        for (var i = 0; i < list.length; i++) {

            if (list[i].CredentialID == id) {

                list[i].Description = description;
                return;

            }

        }

        list.push({ CredentialID: id, Description: description, UserID: userId });

    }

    function _buildDataTable(data, callback, masterKey) {
        var rows = [];

        // Create a table row for each record and add it to the rows array
        $.each(data, function (i, item) {

            rows.push(_createCredentialTableRow(item, masterKey));

        });

        // Fire the callback and pass it the array of rows
        callback(rows);
    }

    // Load all records for a specific user
    function _loadCredentials(userId, masterKey, callback, cachedList) {

        if (cachedList != null) {

            _buildDataTable(cachedList, callback, masterKey);

        } else {

            $.ajax({
                url: '/Main/GetAll',
                data: { userId: userId },
                dataType: 'json',
                type: 'POST',
                success: function (data, status, request) {

                    var items = [];
                    // At this point we only actually need to decrypt Description for display, 
                    // which speeds up client-side table construction time dramatically
                    var excludes = ['CredentialID', 'UserID'];

                    $.each(data, function (i, item) {

                        items.push(_decryptObject(item, masterKey, excludes));

                    });

                    // Cache the whole (decrypted) list on the client
                    cachedList = items;
                    _buildDataTable(cachedList, callback, masterKey);

                },
                error: function (request, status, error) {

                    alert('Http Error: ' + status + ' - ' + error);

                }
            });

        }

    }

    // Show the read-only details dialog 
    function _showDetail(credentialId, masterKey) {

        $.ajax({
            url: '/Main/Load',
            data: { id: credentialId },
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) {

                // CredentialID and UserID are not currently encrypted so don't try to decode them
                var excludeProperties = ['CredentialID', 'UserID'];

                data = _decryptObject(data, masterKey, excludeProperties);

                // Loop through all the properties of the data object (except the excludes)
                // and encode any HTML for display
                $.each(data, function (name, value) {

                    if (!_contains(excludeProperties, name) && name != 'Password')
                        data[name] = _htmlEncode(value);

                });

                var details = [];

                details.push('<table>');

                if (data.Url != '')
                    details.push('<tr><th>Url</th><td><a class="display-link" href="' + data.Url + '" onclick="window.open(this.href); return false;">' + _truncate(data.Url, 30) + '</a></td></tr>');

                if (data.Username != '')
                    details.push('<tr><th>Username ' + _insertCopyLink(data.Username) + '</th><td>' + data.Username + '</td></tr>');

                if (data.Password != '')
                    details.push('<tr><th>Password ' + _insertCopyLink(data.Password) + '</th><td>' + _htmlEncode(data.Password) + '</td></tr>');

                if (data.UserDefined1 != '')
                    details.push('<tr><th>' + data.UserDefined1Label + ' ' + _insertCopyLink(data.UserDefined1) + '</th><td>' + data.UserDefined1 + '</td></tr>');

                if (data.UserDefined2 != '')
                    details.push('<tr><th>' + data.UserDefined2Label + ' ' + _insertCopyLink(data.UserDefined2) + '</th><td>' + data.UserDefined2 + '</td></tr>');

                if (data.Notes != '')
                    details.push('<tr><th>Notes</th><td class="notes">' + data.Notes.replace(/\r\n|\n|\r/gi, '<br />') + '</td></tr>');

                details.push('</table>');

                $('#modal-dialog').html(details.join('')).dialog({ title: data.Description, width: 600, minHeight: 50, modal: true });

            },
            error: function (request, status, error) {

                alert('Http Error: ' + status + ' - ' + error);

            }
        });

    }

    // Load a record into the edit form
    // If null is passed as the credentialId, we set up the form for adding a new record
    function _loadCredential(credentialId, masterKey, userId) {

        if (credentialId != null) {

            $.ajax({
                url: '/Main/Load',
                data: { id: credentialId },
                dataType: 'json',
                type: 'POST',
                success: function (data, status, request) {

                    // CredentialID and UserID are not currently encrypted so don't try to decode them
                    data = _decryptObject(data, masterKey, ['CredentialID', 'UserID']);

                    var f = $('#credential-form');

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

                    $('#credential-form-dialog').dialog({ title: 'Edit Credential', width: 500, modal: true });

                },
                error: function (request, status, error) {

                    alert('Http Error: ' + status + ' - ' + error);

                }
            });

        }
        else { // New record setup

            $('#credential-form-dialog input:not(.submit), #credential-form-dialog textarea').val('');
            $('#credential-form #UserID').val(userId);

            $('#credential-form-dialog').dialog({ title: 'Edit Credential', width: 500, modal: true });

        }

    }

    // Delete a record
    function deleteCredential(credentialId, userId, masterKey, table, tableOptions) {

        $.ajax({
            url: '/Main/Delete',
            data: { credentialId: credentialId, userId: userId },
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) {

                if (data.Success) {

                    // Completely destroy the existing DataTable and remove the table and add link from the DOM
                    table.fnDestroy();
                    $('#records, #add-link').remove();

                    // Remove the deleted item from the cached list before reload
                    _removeFromList(credentialId);

                    // For now we just reload the entire table in the background
                    _loadCredentials(userId, masterKey, function (rows) {

                        $('#container').append(_createCredentialTable(rows));

                        table = $('#records').dataTable(tableOptions);

                        $('#container').append('<p id="add-link"><button onclick="Vault.loadCredential(null, \'' + masterKey + '\'); return false;">Add Item</button> <button onclick="options(); return false;">Options</button></p>');

                        $('#modal-dialog').dialog('destroy');

                        // Append the clear filter button
                        $('#records_filter').before('<input type="button" style="float: right;" onclick="$(\'#records_filter input:last\').val(\'\');$(\'#records_filter input:last\').trigger(\'keyup\');" value="X"/>');

                        $('#records_filter input:last').focus();

                    });

                }

            },
            error: function (request, status, error) {

                alert('Http Error: ' + status + ' - ' + error);

                $('#modal-dialog').dialog('destroy');

            }
        });

    }

    // Show delete confirmation dialog
    function _confirmDelete(id, userId) {

        var dialogHtml = '<p>Are you sure you want to delete this credential?</p>' +
                         '<form>' +
                         '<p><button onclick="$(\'#modal-dialog\').dialog(\'destroy\'); return false;">No</button> <button onclick="deleteCredential(\'' + id + '\', \'' + userId + '\'); return false;">Yes</button></p>' +
                         '</form>';

        $('#modal-dialog').html(dialogHtml).dialog({
            title: 'Delete Credential',
            width: 500,
            modal: true,
            minHeight: 50
        });

    }

    function _generatePasswordHash(password) {

        return Passpack.utils.hashx(password);

    }

    // The hash is now a full 64 char string
    function _generatePasswordHash64(password) {

        return Passpack.utils.hashx(password, false, true);

    }

    function _changePassword(userId, masterKey, oldPassword) {

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

        if (!confirm('When the password change is complete you will be logged out and will need to log back in.\n\nAre you sure you want to change the master password?'))
            return false;

        var newPasswordHash = Passpack.utils.hashx(newPassword);
        // Convert the new master key to Base64 so that encryptObject() gets what it's expecting
        var newMasterKey = _utf8_to_b64(Passpack.utils.hashx(newPassword + Passpack.utils.hashx(newPassword, 1, 1), 1, 1));

        // Show a spinner until complete because this can take some time!
        $('#change-password-button').after('<img id="spinner" src="/content/img/ajax-loader.gif" width="16" height="16" />');

        var newData = [];

        // Get all the credentials, decrypt each with the old password 
        // and re-encrypt it with the new one
        $.ajax({
            url: '/Main/GetAllComplete',
            data: { userId: userId },
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) {

                var excludes = ['CredentialID', 'UserID', 'PasswordConfirmation'];

                $.each(data, function (i, item) {

                    newData.push(_encryptObject(_decryptObject(item, masterKey, excludes), newMasterKey, excludes));

                });

                $.ajax({
                    url: '/Main/UpdateMultiple',
                    data: Passpack.JSON.stringify(newData),
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    type: 'POST',
                    success: function (data, status, request) {

                        // Store the new password in hashed form
                        $.ajax({
                            url: '/Main/UpdatePassword',
                            data: {
                                newHash: newPasswordHash,
                                userid: userId,
                                oldHash: Passpack.utils.hashx(oldPassword)
                            },
                            dataType: 'json',
                            type: 'POST',
                            success: function (data, status, request) {

                                window.location.href = '/';

                            },
                            error: function (request, status, error) {

                                alert('Http Error: ' + status + ' - ' + error);

                            }
                        });

                    },
                    error: function (request, status, error) {

                        alert('Http Error: ' + status + ' - ' + error);

                    }
                });



            },
            error: function (request, status, error) {

                alert('Http Error: ' + status + ' - ' + error);

            }
        });

        return false;

    }

    function _exportData(userId, masterKey) {

        // Show a spinner until complete because this can take some time!
        $('#export-button').after('<img id="spinner" src="/content/img/ajax-loader.gif" width="16" height="16" />');

        var exportItems = [];

        // Get all the credentials, decrypt each one
        $.ajax({
            url: '/Main/GetAllComplete',
            data: { userId: userId },
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) {

                var excludes = ['CredentialID', 'UserID', 'PasswordConfirmation'];

                $.each(data, function (i, item) {

                    exportItems.push(_decryptObject(item, masterKey, excludes));

                });

                // console.log(JSON.stringify(exportItems, undefined, 4));

                var exportWindow = window.open("", "EXPORT_WINDOW", "WIDTH=700, HEIGHT=600");

                if (exportWindow && exportWindow.top) {
                    exportWindow.document.write('<html><head><title>Exported Data</title></head><body style="margin: 0; padding: 0;"><textarea style="border: none; width: 100%; height: 600px;">' + JSON.stringify(exportItems, undefined, 4) + '</textarea></body>');
                } else {
                    alert('The export feature works by opening a popup window, but our popup window was blocked by your browser.');
                }

                $('#spinner').remove();

            },
            error: function (request, status, error) {

                alert('Http Error: ' + status + ' - ' + error);

            }
        });

        return false;

    }

    function _options(userId, masterKey) {

        var dialogHtml = '<p>Change password:</p>' +
                         '<form>' +
                         '<p><label for="NewPassword">Password</label><input type="password" id="NewPassword" name="NewPassword" value="" /></p>' +
                         '<p><label for="NewPasswordConfirm">Confirm</label><input type="password" id="NewPasswordConfirm" name="NewPasswordConfirm" value="" /></p>' +
                         '<p><button class="submit" id=\"change-password-button\" onclick="changePassword(\'' + userId + '\', \'' + masterKey + '\'); return false;">Change Password</button></p>' +
                         '<p><button class="submit" id=\"export-button\" onclick="exportData(\'' + userId + '\', \'' + masterKey + '\'); return false;">Export</button></p>' +
                         '</form>';

        $('#modal-dialog').html(dialogHtml).dialog({
            title: 'Options',
            width: 500,
            modal: true,
            minHeight: 50
        });

    }

    function _createCredentialTable(rows) {

        return '<table id="records" class="display">' +
               '    <thead>' +
               '	    <tr>' +
               '		    <th>Description</th>' +
               '		    <th>Details</th>' +
               '		    <th>Edit</th>' +
               '            <th>Delete</th>' +
               '	    </tr>' +
               '    </thead>' +
               '    <tbody>' +
                       rows.join('') +
               '    </tbody>' +
               '</table>';

    }

    function _createCredentialTableRow(credential, masterKey) {

        var row = [];

        row.push('<tr id=\"' + credential.CredentialID + '\">');
        row.push('<td>');
        row.push();

        // Only show the URL link if there's a URL
        if (credential.Url != '')
            row.push(' <a href="#" onclick="Vault.showDetail(\'' + credential.CredentialID + '\', \'' + masterKey + '\'); return false;">' + credential.Description + '</a>');
        else
            row.push(credential.Description);

        row.push('</td>');
        row.push('<td class="center"><a href="#" onclick="Vault.showDetail(\'' + credential.CredentialID + '\', \'' + masterKey + '\'); return false;" title="View Details"><img src="/content/img/key.png" width="16" height="16" alt="View Details" /></a></td>');
        row.push('<td class="center"><a href="#" onclick="Vault.loadCredential(\'' + credential.CredentialID + '\', \'' + masterKey + '\'); return false;" title="Edit Details"><img src="/content/img/edit.png" width="16" height="16" alt="Edit Details" /></a></td>');
        row.push('<td class="center"><a href="#" onclick="Vault.confirmDelete(\'' + credential.CredentialID + '\'); return false;" title="Delete"><img src="/content/img/delete.png" width="16" height="16" alt="Delete" /></a></td>');
        row.push('</tr>');

        return row.join('');

    }

    function _validateRecord(f) {

        var errors = [];

        // $('#CredentialID', f).val(data.CredentialID);

        var description = $('#Description', f);
        var password = $('#Password', f);
        var passwordConfirmation = $('#PasswordConfirmation', f);

        if (description.val() == '')
            errors.push({ field: description, msg: 'You must fill in a Description' });

        // $('#Username', f).val(data.Username);

        // We don't mind if these are blank, but they must be the same!
        if (password.val() != passwordConfirmation.val())
            errors.push({ field: passwordConfirmation, msg: 'Password confirmation does not match' });

        // $('#UserID', f).val(data.UserID);

        return errors;

    }

    // Encode string to Base64
    var _utf8_to_b64 = function (str) {
        return window.btoa(encodeURIComponent(escape(str)));
    };

    // Decode Base64 string
    var _b64_to_utf8 = function (str) {
        return unescape(decodeURIComponent(window.atob(str)));
    };

    // Utility function to check a value exists in an array
    var _contains = function (arr, value) {
        for (var i = 0; i < arr.length; i++)
            if (arr[i] == value) return true;
        return false;
    };

    // Truncate a string at a specified length
    var _truncate = function (str, len) {
        return (str.length > len) ? str.substring(0, (len - 3)) + '...' : str;
    };

    // Initialise the app
    var _init = function () {
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

        // Load the datatable stylesheet dynamically
        var tableStyles = $('<link rel="stylesheet" type="text/css" href="/content/css/datatables.css" />');
        $("head").append(tableStyles);

        // Initialise globals and load data on correct login
        _ui.loginForm.on('submit', function () {

            var username = _ui.loginForm.find('#Username').val();
            var password = _ui.loginForm.find('#Password').val();

            _ui.loginFormDialog.find('.submit').after('<img id="spinner" src="/content/img/ajax-loader.gif" width="16" height="16" />');

            $.ajax({
                url: '/Main/Login',
                data: {
                    Username: Passpack.utils.hashx(username),
                    Password: Passpack.utils.hashx(password)
                },
                dataType: 'json',
                type: 'POST',
                success: function (data, status, request) {

                    // If the details were valid
                    if (data.result == 1 && data.id != '') {

                        // Set some private variables so that we can use them for encryption during this session
                        _userId = data.id;
                        _username = username;
                        _password = password;
                        _masterKey = _utf8_to_b64(window.Passpack.utils.hashx(_password + Passpack.utils.hashx(_password, 1, 1), 1, 1));

                        _loadCredentials(_userId, _masterKey, function (rows) {

                            _ui.container.append(_createCredentialTable(rows));
                            // Cache the table selector
                            _ui.records = $('#records');

                            _table = _ui.records.dataTable(_tableOptions);

                            // Successfully logged in. Hide the login form
                            _ui.container.append('<p id="add-link"><button onclick="Vault.loadCredential(null, \'' + _masterKey + '\'); return false;">Add Item</button> <button onclick="options(); return false;">Options</button></p>');
                            _ui.loginForm.hide();
                            _ui.loginFormDialog.dialog('destroy');

                            // Append the clear filter button
                            _ui.recordsFilter.before('<input type="button" style="float: right;" onclick="$(\'#records_filter input:last\').val(\'\');$(\'#records_filter input:last\').trigger(\'keyup\');" value="X"/>');

                            _ui.recordsFilter.find('input:last').focus();

                        });

                    }

                    _ui.spinner.remove();

                },
                error: function (request, status, error) {

                    alert('Http Error: ' + status + ' - ' + error);

                    _ui.spinner.remove();

                }
            });

            return false;

        });

        // Save the new details on edit form submit
        $('#credential-form').on('submit', function () {

            $('#validation-message').remove();
            $('input[class!=submit], textarea', $(this)).removeClass('invalid');

            var errors = validateRecord($(this));
            var errorMsg = [];

            if (errors.length > 0) {

                for (var i = 0; i < errors.length; i++) {
                    errorMsg.push(errors[i].msg);
                    errors[i].field.addClass('invalid');
                }

                $(this).prepend('<div id="validation-message"><p>' + errorMsg.join('<br />') + '</p></div>');
                return false;

            }

            $('.submit', $(this)).after('<img id="spinner" src="/content/img/ajax-loader.gif" width="16" height="16" />');

            var credential = {};

            // Serialize the form into an object
            $('input[class!=submit], textarea', $(this)).each(function () {
                credential[this.name] = $(this).val();
            });

            // Hold the modified Description so we can update the list if the update succeeds
            var description = $('#Description', $(this)).val();

            // CredentialID and UserID are not currently encrypted so don't try to decode them
            credential = Vault.encryptObject(credential, $_VAULT.MASTER_KEY, ['CredentialID', 'UserID']);

            $.ajax({
                url: '/Main/Update',
                data: credential,
                dataType: 'json',
                type: 'POST',
                success: function (data, status, request) {

                    // Update the cached credential list with the new Description so it is correct when we rebuild 
                    Vault.updateDescription(data.CredentialID, description, Vault.userId);

                    // Completely destroy the existing DataTable and remove the table and add link from the DOM
                    Vault.table.fnDestroy();
                    $('#records, #add-link').remove();

                    // For now we just reload the entire table in the background
                    _loadCredentials(Vault.userId, Vault.masterKey, function (rows) {

                        $('#container').append(createCredentialTable(rows));

                        Vault.table = $('#records').dataTable(Vault.tableOptions);

                        $('#container').append('<p id="add-link"><button onclick="Vault.loadCredential(null, \'' + Vault.masterKey + '\'); return false;">Add Item</button></p>');

                        $('#spinner').remove();

                        $('#credential-form-dialog').dialog('destroy');

                        // Append the clear filter button
                        $('#records_filter').before('<input type="button" style="float: right;" onclick="$(\'#records_filter input:last\').val(\'\');$(\'#records_filter input:last\').trigger(\'keyup\');" value="X"/>');

                        $('#records_filter input:last').focus();

                    });

                },
                error: function (request, status, error) {

                    alert('Http Error: ' + status + ' - ' + error);

                    $('#spinner').remove();

                }
            });

            return false;

        });
    };

    var _userId = '',
    _username = '',
    _password = '',
    _masterKey = '',
    _table = null,
    _tableOptions = {
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
    _cachedList = null, 
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
    };

    // Expose public methods
    var vault = {
        init: _init,
        showDetail: _showDetail,
        loadCredential: _loadCredential,
        confirmDelete: _confirmDelete
    };

    return vault;

}(jQuery));


$(function () {

    Vault.init();

});