// Global object to hold user/encryption data and table specifications
window.$_VAULT = {
    USER_ID: '',
    USERNAME: '',
    PASSWORD: '',
    MASTER_KEY: '',
    TABLE: null,
    TABLE_OPTIONS: {
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
    BASE_URL: '',
    CACHED_LIST: null
};

function htmlEncode(value) {

    return $('<div/>').text(value).html();

}

function htmlDecode(value) {

    return $('<div/>').html(value).text();
    
}

// Utility function to check a value exists in an array
Array.prototype.contains = function (value) {

    for (var i = 0; i < this.length; i++)
        if (this[i] == value) return true;

    return false;

};

// Truncate a string at a specified length
String.prototype.truncate = function (len) {

    return (this.length > len) ? this.substring(0, (len - 3)) + '...' : this;

}

// Encrypt the properties of an object literal using Passpack
// excludes is an array of property names whose values should not be encrypted
function encryptObject(obj, masterKey, excludes) {

    for (var p in obj)
        if (!excludes.contains(p))
            obj[p] = Passpack.encode('AES', obj[p], masterKey);

    return obj;

}

// Encrypt the properties of an object literal using Passpack
// excludes is an array of property names whose values should not be encrypted
function decryptObject(obj, masterKey, excludes) {

    for (var p in obj)
        if (!excludes.contains(p))
            obj[p] = Passpack.decode('AES', obj[p], masterKey);

    return obj;

}

function removeFromList(id) {

    var list = $_VAULT.CACHED_LIST;

    var i;

    for (i = 0; i < list.length; i++) {

        if (list[i].CredentialID == id) {

            break;

        }

    }

    $_VAULT.CACHED_LIST.splice(i, 1);

}

function updateDescription(id, description, userId) {

    var list = $_VAULT.CACHED_LIST;

    for (var i = 0; i < list.length; i++) {

        if (list[i].CredentialID == id) {

            list[i].Description = description;
            return;

        }

    }

    list.push({ CredentialID: id, Description: description, UserID: userId });

}

function buildDataTable(data, callback)
{
    var rows = [];

    // Create a table row for each record and add it to the rows array
    $.each(data, function (i, item) {

        rows.push(createCredentialTableRow(item));

    });

    // Fire the callback and pass it the array of rows
    callback(rows);
}

// Load all records for a specific user
function loadCredentials(userId, masterKey, callback) {

    if ($_VAULT.CACHED_LIST != null) {

        buildDataTable($_VAULT.CACHED_LIST, callback);

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

                    items.push(decryptObject(item, masterKey, excludes));

                });

                // Cache the whole (decrypted) list on the client
                $_VAULT.CACHED_LIST = items;
                buildDataTable($_VAULT.CACHED_LIST, callback);

            },
            error: function (request, status, error) {

                alert('Http Error: ' + status + ' - ' + error);

            }
        });

    }

}

function insertCopyLink(text) {

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

// Show the read-only details dialog 
function showDetail(credentialId, masterKey) {

    $.ajax({
        url: '/Main/Load',
        data: { id: credentialId },
        dataType: 'json',
        type: 'POST',
        success: function (data, status, request) {

            // CredentialID and UserID are not currently encrypted so don't try to decode them
            var excludeProperties = ['CredentialID', 'UserID'];

            data = decryptObject(data, masterKey, excludeProperties);

            // Loop through all the properties of the data object (except the excludes)
            // and encode any HTML for display
            $.each(data, function (name, value) {

                if(!excludeProperties.contains(name))
                    data[name] = htmlEncode(value);

            });

            var details = [];

            details.push('<table>');

            if (data.Url != '')
                details.push('<tr><th>Url</th><td><a class="display-link" href="' + data.Url + '" onclick="window.open(this.href); return false;">' + data.Url.truncate(30) + '</a></td></tr>');

            if (data.Username != '')
                details.push('<tr><th>Username ' + insertCopyLink(data.Username) + '</th><td>' + data.Username + '</td></tr>');

            if (data.Password != '')
                details.push('<tr><th>Password ' + insertCopyLink(data.Password) + '</th><td>' + data.Password + '</td></tr>');

            if (data.UserDefined1 != '')
                details.push('<tr><th>' + data.UserDefined1Label + ' ' + insertCopyLink(data.UserDefined1) + '</th><td>' + data.UserDefined1 + '</td></tr>');

            if (data.UserDefined2 != '')
                details.push('<tr><th>' + data.UserDefined2Label + ' ' + insertCopyLink(data.UserDefined2) + '</th><td>' + data.UserDefined2 + '</td></tr>');

            if (data.Notes != '')
                details.push('<tr><th>Notes</th><td class="notes">' + data.Notes.replace(/\r\n|\n|\r/gi, '<br />') + '</td></tr>');

            details.push('</table>');

            $('#modal-dialog').html(details.join('')).dialog({ title: data.Description, width: 500, minHeight: 50, modal: true });

        },
        error: function (request, status, error) {

            alert('Http Error: ' + status + ' - ' + error);

        }
    });

}

// Load a record into the edit form
// If null is passed as the credentialId, we set up the form for adding a new record
function loadCredential(credentialId, masterKey) {

    if (credentialId != null) {

        $.ajax({
            url: '/Main/Load',
            data: { id: credentialId },
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) {

                // CredentialID and UserID are not currently encrypted so don't try to decode them
                data = decryptObject(data, masterKey, ['CredentialID', 'UserID']);

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
        $('#credential-form #UserID').val($_VAULT.USER_ID);

        $('#credential-form-dialog').dialog({ title: 'Edit Credential', width: 500, modal: true });

    }

}

// Delete a record
function deleteCredential(credentialId, userId) {

    $.ajax({
        url: '/Main/Delete',
        data: { credentialId: credentialId, userId: userId },
        dataType: 'json',
        type: 'POST',
        success: function (data, status, request) {

            if (data.Success) {

                // Completely destroy the existing DataTable and remove the table and add link from the DOM
                $_VAULT.TABLE.fnDestroy();
                $('#records, #add-link').remove();

                // Remove the deleted item from the cached list before reload
                removeFromList(credentialId);

                // For now we just reload the entire table in the background
                loadCredentials($_VAULT.USER_ID, $_VAULT.MASTER_KEY, function (rows) {

                    $('#container').append(createCredentialTable(rows));

                    $_VAULT.TABLE = $('#records').dataTable($_VAULT.TABLE_OPTIONS);

                    $('#container').append('<p id="add-link"><button onclick="loadCredential(null, \'' + $_VAULT.MASTER_KEY + '\'); return false;">Add Item</button> <button onclick="options(); return false;">Options</button></p>');

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
function confirmDelete(id) {

    var dialogHtml = '<p>Are you sure you want to delete this credential?</p>' +
                     '<form>' +
                     '<p><button onclick="$(\'#modal-dialog\').dialog(\'destroy\'); return false;">No</button> <button onclick="deleteCredential(\'' + id + '\', \'' + $_VAULT.USER_ID + '\'); return false;">Yes</button></p>' +
                     '</form>';

    $('#modal-dialog').html(dialogHtml).dialog({
        title: 'Delete Credential',
        width: 500, 
        modal: true,
        minHeight: 50
    });

}

function generatePasswordHash(password) {

    return Passpack.utils.hashx(password);

}

// The hash is now a full 64 char string
function generatePasswordHash64(password) {

    return Passpack.utils.hashx(password, false, true);

}

function changePassword(userId, masterKey) {

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
    var newMasterKey = Passpack.utils.hashx(newPassword + Passpack.utils.hashx(newPassword, 1, 1), 1, 1);

    //console.log($_VAULT);

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

            var excludes = ['CredentialID', 'UserID'];

            $.each(data, function (i, item) {

                newData.push(encryptObject(decryptObject(item, masterKey, excludes), newMasterKey, excludes));

            });

            //console.log(newData);

            $.ajax({
                url: '/Main/UpdateMultiple',
                data: JSON.stringify(newData),
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                type: 'POST',
                success: function (data, status, request) {

                    console.log('Saved all');

                    // Store the new password in hashed form
                    $.ajax({
                        url: '/Main/UpdatePassword',
                        data: {
                            newHash: newPasswordHash,
                            userid: $_VAULT.USER_ID,
                            oldHash: Passpack.utils.hashx($_VAULT.PASSWORD)
                        },
                        dataType: 'json',
                        type: 'POST',
                        success: function (data, status, request) {

                            window.location.href = '/';

                        },
                        error: function (request, status, error) {

                            console.log('Http Error: ' + status + ' - ' + error);

                        }
                    });

                },
                error: function (request, status, error) {

                    console.log('Http Error: ' + status + ' - ' + error);

                }
            });



        },
        error: function (request, status, error) {

            alert('Http Error: ' + status + ' - ' + error);

        }
    });

    return false;

}

function options() {

    var dialogHtml = '<p>Change password:</p>' +
                     '<form>' +
                     '<p><label for="NewPassword">Password</label><input type="text" id="NewPassword" name="NewPassword" value="" /></p>' +
                     '<p><label for="NewPasswordConfirm">Confirm</label><input type="text" id="NewPasswordConfirm" name="NewPasswordConfirm" value="" /></p>' +
                     '<p><button id=\"change-password-button\" onclick="changePassword(\'' + $_VAULT.USER_ID + '\', \'' + $_VAULT.MASTER_KEY + '\'); return false;">Change Password</button></p>' +
                     '</form>';

    $('#modal-dialog').html(dialogHtml).dialog({
        title: 'Options',
        width: 500,
        modal: true,
        minHeight: 50
    });

}

function createCredentialTable(rows) {

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

function createCredentialTableRow(credential) {

    var row = [];

    row.push('<tr id=\"' + credential.CredentialID + '\">');
    row.push('<td>');
    row.push();

    // Only show the URL link if there's a URL
    if (credential.Url != '')
        row.push(' <a href="#" onclick="showDetail(\'' + credential.CredentialID + '\', \'' + $_VAULT.MASTER_KEY + '\'); return false;">' + credential.Description + '</a>');
    else
        row.push(credential.Description);

    row.push('</td>');
    row.push('<td class="center"><a href="#" onclick="showDetail(\'' + credential.CredentialID + '\', \'' + $_VAULT.MASTER_KEY + '\'); return false;" title="View Details"><img src="/content/img/key.png" width="16" height="16" alt="View Details" /></a></td>');
    row.push('<td class="center"><a href="#" onclick="loadCredential(\'' + credential.CredentialID + '\', \'' + $_VAULT.MASTER_KEY + '\'); return false;" title="Edit Details"><img src="/content/img/edit.png" width="16" height="16" alt="Edit Details" /></a></td>');
    row.push('<td class="center"><a href="#" onclick="confirmDelete(\'' + credential.CredentialID + '\'); return false;" title="Delete"><img src="/content/img/delete.png" width="16" height="16" alt="Delete" /></a></td>');
    row.push('</tr>');

    return row.join('');

}

function validateRecord(f) {

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

$(function () {

    $('body').append('<div id="modal-dialog"></div>');

    // Load the datatable stylesheet
    var tableStyles = $("<link>");

    tableStyles.attr({
        type: 'text/css',
        rel: 'stylesheet',
        href: $_VAULT.BASE_URL + 'content/css/datatables.css'
    });

    $("head").append(tableStyles);

    // Initialise globals and load data on correct login
    $('#login-form').on('submit', function () {

        var _username = $('#login-form #Username').val();
        var _password = $('#login-form #Password').val();

        $('#login-form-dialog .submit').after('<img id="spinner" src="/content/img/ajax-loader.gif" width="16" height="16" />');

        $.ajax({
            url: '/Main/Login',
            data: {
                Username: Passpack.utils.hashx(_username),
                Password: Passpack.utils.hashx(_password)
            },
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) {

                // If the details were valid
                if (data.result == 1 && data.id != '') {

                    // Set some global variables so that we can use them for encryption during this session
                    $_VAULT.USER_ID = data.id;
                    $_VAULT.USERNAME = _username;
                    $_VAULT.PASSWORD = _password;
                    $_VAULT.MASTER_KEY = Passpack.utils.hashx($_VAULT.PASSWORD + Passpack.utils.hashx($_VAULT.PASSWORD, 1, 1), 1, 1);

                    loadCredentials($_VAULT.USER_ID, $_VAULT.MASTER_KEY, function (rows) {

                        $('#container').append(createCredentialTable(rows));

                        $_VAULT.TABLE = $('#records').dataTable($_VAULT.TABLE_OPTIONS);

                        // Successfully logged in. Hide the login form
                        $('#container').append('<p id="add-link"><button onclick="loadCredential(null, \'' + $_VAULT.MASTER_KEY + '\'); return false;">Add Item</button> <button onclick="options(); return false;">Options</button></p>');
                        $('#login-form').hide();
                        $('#login-form-dialog').dialog('destroy');

                        // Append the clear filter button
                        $('#records_filter').before('<input type="button" style="float: right;" onclick="$(\'#records_filter input:last\').val(\'\');$(\'#records_filter input:last\').trigger(\'keyup\');" value="X"/>');

                        $('#records_filter input:last').focus();



                    });

                }

                $('#spinner').remove();

            },
            error: function (request, status, error) {

                alert('Http Error: ' + status + ' - ' + error);

                $('#spinner').remove();

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
        credential = encryptObject(credential, $_VAULT.MASTER_KEY, ['CredentialID', 'UserID']);

        $.ajax({
            url: '/Main/Update',
            data: credential,
            dataType: 'json',
            type: 'POST',
            success: function (data, status, request) {

                // Update the cached credential list with the new Description so it is correct when we rebuild 
                updateDescription(data.CredentialID, description, $_VAULT.USER_ID);

                // Completely destroy the existing DataTable and remove the table and add link from the DOM
                $_VAULT.TABLE.fnDestroy();
                $('#records, #add-link').remove();

                // For now we just reload the entire table in the background
                loadCredentials($_VAULT.USER_ID, $_VAULT.MASTER_KEY, function (rows) {

                    $('#container').append(createCredentialTable(rows));

                    $_VAULT.TABLE = $('#records').dataTable($_VAULT.TABLE_OPTIONS);

                    $('#container').append('<p id="add-link"><button onclick="loadCredential(null, \'' + $_VAULT.MASTER_KEY + '\'); return false;">Add Item</button></p>');

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

});