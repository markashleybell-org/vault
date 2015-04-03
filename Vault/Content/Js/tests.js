/*
var testMethods = {
    insertCopyLink: _insertCopyLink,
    encryptObject: _encryptObject,
    decryptObject: _decryptObject,
    removeFromList: _removeFromList,
    updateDescription: _updateDescription,
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
    contains: _contains,
    truncate: _truncate,
    search: _search,
    debounce: _debounce,
    sortCredentials: _sortCredentials,
    init: _init
};
*/

QUnit.begin(function () {
    console.log('start tests');
});

QUnit.testStart(function () {
    Vault.init(true);
});

QUnit.testDone(function () {
    console.log('end test');
});

QUnit.done(function () {
    console.log('end tests');
});

QUnit.test('Got Vault', function (assert) {
    assert.ok(typeof Vault !== 'undefined');
});

QUnit.test('Test _insertCopyLink', function (assert) {
    var copyLink = $(Vault.insertCopyLink('http://www.test.com'));
    assert.ok(copyLink.find('param[name="FlashVars"]').attr('value') === 'text=http%3A%2F%2Fwww.test.com');
});

QUnit.test('Test _encryptObject', function (assert) {
    // base64encode('test123' + passpackhash('test123'))
    var masterKey = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
    var masterKeyDecoded = window.unescape(decodeURIComponent(window.atob(masterKey)));
    var credential = {
        CredentialID: '361fe91a-3dca-4871-b69e-c41c31507c8c',
        Description: 'Test Credential',
        Notes: 'Test Notes:\n\nThese are test notes.',
        Password: '8{s?(\'7.171h)3H',
        PasswordConfirmation: '8{s?(\'7.171h)3H',
        Url: 'http://www.test.com?id=23&param=TEST+VALUE',
        UserDefined1: 'CUSTOM1',
        UserDefined1Label: 'Custom 1',
        UserDefined2: 'CUSTOM2',
        UserDefined2Label: 'Custom 2',
        UserID: 'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
        Username: '_testuser123'
    };
    var encrypted = Vault.encryptObject(credential, masterKey, ['CredentialID', 'UserID']);
    assert.ok(encrypted.CredentialID === '361fe91a-3dca-4871-b69e-c41c31507c8c');
    assert.ok(Passpack.decode('AES', encrypted.Description, masterKeyDecoded) === 'Test Credential');
    assert.ok(Passpack.decode('AES', encrypted.Notes, masterKeyDecoded) === 'Test Notes:\n\nThese are test notes.');
    assert.ok(Passpack.decode('AES', encrypted.Password, masterKeyDecoded) === '8{s?(\'7.171h)3H');
    assert.ok(Passpack.decode('AES', encrypted.PasswordConfirmation, masterKeyDecoded) === '8{s?(\'7.171h)3H');
    assert.ok(Passpack.decode('AES', encrypted.Url, masterKeyDecoded) === 'http://www.test.com?id=23&param=TEST+VALUE');
    assert.ok(Passpack.decode('AES', encrypted.UserDefined1, masterKeyDecoded) === 'CUSTOM1');
    assert.ok(Passpack.decode('AES', encrypted.UserDefined1Label, masterKeyDecoded) === 'Custom 1');
    assert.ok(Passpack.decode('AES', encrypted.UserDefined2, masterKeyDecoded) === 'CUSTOM2');
    assert.ok(Passpack.decode('AES', encrypted.UserDefined2Label, masterKeyDecoded) === 'Custom 2');
    assert.ok(encrypted.UserID === 'ef0ee37f-2ace-417c-b30d-ccfaf4450906');
    assert.ok(Passpack.decode('AES', encrypted.Username, masterKeyDecoded) === '_testuser123');
});

QUnit.test('Test _decryptObject', function (assert) {
    // base64encode('test123' + passpackhash('test123'))
    var masterKey = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
    var masterKeyDecoded = window.unescape(decodeURIComponent(window.atob(masterKey)));
    var credential = {
        CredentialID: '361fe91a-3dca-4871-b69e-c41c31507c8c',
        Description: 'EcOPw4TDj0gBITAhITAhLSExMCFQITEwIWJHQcK9wpJtXHQgRMKtaw==',
        Notes: 'FcOPw4TDj0gBITAhITAhLcOJFBjCvcOzw43CtVxmwoJzw4pAw63CpcKRLSkDwpg5LiE0NSHCmwNTajjCmVbCtMKAwq0tw43CvQ==',
        Password: 'E8OPw4TDj0gBITAhITAhLUnDiMKTVMOrfk0hMCEhMzMhwoHCozx3w5AI',
        PasswordConfirmation: 'E8OPw4TDj0gBITAhITAhLUnDiMKTVMOrfk0hMCEhMzMhwoHCozx3w5AI',
        Url: 'E8OPw4TDj0gBITAhITAhLRnDh8KUG8O5dlVZZ8OBwrwgO8KQNDctecKbM8KGworDmzoUbsOrSEnCrMKSDyMtNkhZw6/Cgyp5ZSExMiEG',
        UserDefined1: 'FMOPw4TDj0gBITAhITAhLW88TTrDrEXDvw==',
        UserDefined1Label: 'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmM=',
        UserDefined2: 'FcOPw4TDj0gBITAhITAhLcOeJDjCncKcw47DqA==',
        UserDefined2Label: 'FMOPw4TDj0gBITAhITAhLW8cbRrDjGXDrmA=',
        UserID: 'ef0ee37f-2ace-417c-b30d-ccfaf4450906',
        Username: 'EsOPw4TDj0gBITAhITAhLcKHw7LChcOKwpUHbsOIw60iYXs='
    };
    var decrypted = Vault.decryptObject(credential, masterKey, ['CredentialID', 'UserID']);
    assert.ok(decrypted.CredentialID === '361fe91a-3dca-4871-b69e-c41c31507c8c');
    assert.ok(decrypted.Description === 'Test Credential');
    assert.ok(decrypted.Notes === 'Test Notes:\n\nThese are test notes.');
    assert.ok(decrypted.Password === '8{s?(\'7.171h)3H');
    assert.ok(decrypted.PasswordConfirmation === '8{s?(\'7.171h)3H');
    assert.ok(decrypted.Url === 'http://www.test.com?id=23&param=TEST+VALUE');
    assert.ok(decrypted.UserDefined1 === 'CUSTOM1');
    assert.ok(decrypted.UserDefined1Label === 'Custom 1');
    assert.ok(decrypted.UserDefined2 === 'CUSTOM2');
    assert.ok(decrypted.UserDefined2Label === 'Custom 2');
    assert.ok(decrypted.UserID === 'ef0ee37f-2ace-417c-b30d-ccfaf4450906');
    assert.ok(decrypted.Username === '_testuser123');
});

QUnit.test('Test _removeFromList', function (assert) {
    var list = [
        { CredentialID: 1, Description: 'ITEM1' },
        { CredentialID: 2, Description: 'ITEM2' },
        { CredentialID: 3, Description: 'ITEM3' }
    ];
    Vault.removeFromList(2, list);
    assert.ok(list.length === 2);
    assert.ok(list[0].Description === 'ITEM1');
    assert.ok(list[1].Description === 'ITEM3');
});

QUnit.test('Test _updateProperties', function (assert) {
    var list = [
        { CredentialID: 1, Description: 'ITEM1', UserID: '1', Username: 'item1', Password: 'is9j' },
        { CredentialID: 2, Description: 'ITEM2', UserID: '1', Username: 'item2', Password: '4ngi' },
        { CredentialID: 3, Description: 'ITEM3', UserID: '1', Username: 'item3', Password: 's05n' }
    ];
    var userId = 1;
    Vault.updateProperties(2, { Description: 'ITEM2UPDATE', Username: 'item2new', Password: 'abcd' }, userId, list);
    Vault.updateProperties(0, { Description: 'ITEM4', Username: 'item4', Password: 'c9yn' }, userId, list);
    assert.ok(list[1].Description === 'ITEM2UPDATE');
    assert.ok(list[1].Username === 'item2new');
    assert.ok(list[1].Password === 'abcd');
    assert.ok(list.length === 4);
    assert.ok(list[3].CredentialID === 0);
    assert.ok(list[3].Description == 'ITEM4');
    assert.ok(list[3].Username === 'item4');
    assert.ok(list[3].Password === 'c9yn');
    assert.ok(list[3].UserID === 1);
});

QUnit.test('Test _defaultAjaxErrorCallback', function (assert) {
    var originalAlert = window.alert;
    window.alert = function (msg) { return msg; };
    var alertResult = Vault.defaultAjaxErrorCallback(null, 'STATUS', 'ERROR');
    window.alert = originalAlert;
    assert.ok(alertResult === 'Http Error: STATUS - ERROR');
});

QUnit.test('Test _ajaxPost', function (assert) { });
QUnit.test('Test _loadCredentials', function (assert) { });
QUnit.test('Test _showDetail', function (assert) { });
QUnit.test('Test _defaultAcceptAction', function (assert) { });
QUnit.test('Test _defaultCloseAction', function (assert) { });
QUnit.test('Test _showModal', function (assert) { });
QUnit.test('Test _loadCredential', function (assert) { });
QUnit.test('Test _deleteCredential', function (assert) { });
QUnit.test('Test _confirmDelete', function (assert) { });

QUnit.test('Test _generatePasswordHash', function (assert) {
    var hash = Vault.generatePasswordHash('TEST');
    assert.ok(hash === '94053587014b06e04fa78bc6fd5af62c');
});

QUnit.test('Test _generatePasswordHash64', function (assert) {
    var hash = Vault.generatePasswordHash64('TEST');
    assert.ok(hash === '94ee059335e587e501cc4bf90613e0814f00a7b08bc7c648fd865a2af6a22cc2');
});

QUnit.test('Test _changePassword', function (assert) { });
QUnit.test('Test _exportData', function (assert) { });
QUnit.test('Test _options', function (assert) { });

QUnit.test('Test _buildDataTable', function (assert) {
    expect(4);
    var masterKey = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
    var userId = 1;
    var list = [
        { CredentialID: 1, Description: 'Cat', UserID: 1 },
        { CredentialID: 2, Description: 'Dog', UserID: 1 },
        { CredentialID: 3, Description: 'Fish', UserID: 1 }
    ];
    var rows = Vault.buildDataTable(list, function (rows) {
        assert.ok(rows.length === 3);
        assert.ok(rows[0].credentialid === 1 && rows[0].description === 'Cat' && rows[0].masterkey === masterKey && rows[0].userid === 1);
        assert.ok(rows[1].credentialid === 2 && rows[1].description === 'Dog' && rows[1].masterkey === masterKey && rows[1].userid === 1);
        assert.ok(rows[2].credentialid === 3 && rows[2].description === 'Fish' && rows[2].masterkey === masterKey && rows[2].userid === 1);
    }, masterKey, userId);
});

QUnit.test('Test _createCredentialTable', function (assert) {
    var masterKey = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
    var data = [
        { credentialid: 1, masterkey: masterKey, userid: 1, description: 'ITEM1' },
        { credentialid: 2, masterkey: masterKey, userid: 1, description: 'ITEM2' },
        { credentialid: 3, masterkey: masterKey, userid: 1, description: 'ITEM3' },
    ];
    var table = $(Vault.createCredentialTable(data));
    var rows = table.find('tr');
    assert.ok(rows.length === 3);
    assert.ok($(rows[0]).attr('id') === '1');
    assert.ok($(rows[1]).find('td:first span.full').html() === 'ITEM2');
});

QUnit.test('Test _createCredentialDisplayData', function (assert) {
    // base64encode('test123' + passpackhash('test123'))
    var masterKey = 'JTI1OTElMjUyNXMlMjVDMUklNDBZJTI1QzUlMjU5MUclMjVCRiUyNTk0JTI1QjVBJTI1ODAlMjUxRg==';
    var credential = { CredentialID: 1, Description: 'ITEM1' };
    var data = Vault.createCredentialDisplayData(credential, masterKey, 5);
    assert.ok(data.credentialid === 1);
    assert.ok(data.description === 'ITEM1');
    assert.ok(data.userid === 5);
    assert.ok(data.masterkey === masterKey);
});

QUnit.test('Test _validateRecord', function (assert) {
    var form = $('<form><input id="Description" name="Description" />' +
                 '<input id="Password" name="Password" />' + 
                 '<input id="PasswordConfirmation" name="PasswordConfirmation" /></form>');
    form.find('#Password').val('A');
    var noDescription = Vault.validateRecord(form);
    form.find('#Description').val('A');
    var passwordNoMatch = Vault.validateRecord(form);
    form.find('#PasswordConfirmation').val('A');
    var valid = Vault.validateRecord(form);
    assert.ok(noDescription.length === 2 && noDescription[0].field.attr('id') == 'Description' && noDescription[1].field.attr('id') == 'PasswordConfirmation');
    assert.ok(passwordNoMatch.length === 1 && passwordNoMatch[0].field.attr('id') == 'PasswordConfirmation');
    assert.ok(valid.length === 0);
});

QUnit.test('Test _utf8_to_b64', function (assert) {
    var b64 = Vault.utf8_to_b64('TEST');
    assert.ok(b64 === 'VEVTVA==');
});

QUnit.test('Test _b64_to_utf8', function (assert) {
    var utf8 = Vault.b64_to_utf8('VEVTVA==');
    assert.ok(utf8 === 'TEST');
});

QUnit.test('Test _contains', function (assert) {
    var list = [1, 2, 3];
    assert.ok(Vault.contains(list, 2) === true);
    assert.ok(Vault.contains(list, 4) === false);
});

QUnit.test('Test _truncate', function (assert) {
    var testString = 'This Is A Test';
    assert.ok(Vault.truncate(testString, 10) === 'This Is...');
    assert.ok(Vault.truncate(testString, 20) === 'This Is A Test');
});

QUnit.test('Test _search', function (assert) {
    var list = [
        { CredentialID: 1, Description: 'Cat', UserID: '1' },
        { CredentialID: 2, Description: 'Dog', UserID: '1' },
        { CredentialID: 3, Description: 'Fish', UserID: '1' },
        { CredentialID: 3, Description: 'Catfish', UserID: '1' },
        { CredentialID: 3, Description: 'Dogfish', UserID: '1' }
    ];
    var noresults1 = Vault.search(null, list);
    var noresults2 = Vault.search('', list);
    var noresults3 = Vault.search('d', list);
    assert.ok(noresults1.length === 0 && noresults2.length === 0 && noresults3.length === 0);
    var results = Vault.search('do', list);
    assert.ok(results.length === 2);
    assert.ok(results[0].Description === 'Dog');
    assert.ok(results[1].Description === 'Dogfish');
});

QUnit.asyncTest('Test _debounce', function (assert) {
    expect(3);
    var flag = false;
    var func = Vault.debounce(function () {
        flag = true;
    }, 100);
    func();
    assert.ok(flag === false);
    setTimeout(function () {
        assert.ok(flag === true);
        QUnit.start();
    }, 110);
    var flag2 = false;
    var func2 = Vault.debounce(function () {
        flag2 = true;
    }, 100, true);
    func2();
    assert.ok(flag2 === true);
});

QUnit.test('Test _sortCredentials', function (assert) {
    var list = [
        { CredentialID: 1, Description: 'BBB', UserID: '1' },
        { CredentialID: 2, Description: 'AAA', UserID: '1' },
        { CredentialID: 3, Description: 'DDD', UserID: '1' },
        { CredentialID: 4, Description: 'CCC', UserID: '1' }
    ];
    Vault.sortCredentials(list);
    assert.ok(list[0].Description === 'AAA');
    assert.ok(list[1].Description === 'BBB');
    assert.ok(list[2].Description === 'CCC');
    assert.ok(list[3].Description === 'DDD');
});

QUnit.test('Test _init', function (assert) { });