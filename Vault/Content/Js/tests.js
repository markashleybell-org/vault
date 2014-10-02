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
    setUpCredentialEditModal: _setUpCredentialEditModal,
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
    createCredentialTableRow: _createCredentialTableRow,
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

QUnit.test('Test _updateDescription', function (assert) { });
QUnit.test('Test _defaultAjaxErrorCallback', function (assert) { });
QUnit.test('Test _ajaxPost', function (assert) { });
QUnit.test('Test _loadCredentials', function (assert) { });
QUnit.test('Test _showDetail', function (assert) { });
QUnit.test('Test _defaultAcceptAction', function (assert) { });
QUnit.test('Test _defaultCloseAction', function (assert) { });
QUnit.test('Test _showModal', function (assert) { });
QUnit.test('Test _setUpCredentialEditModal', function (assert) { });
QUnit.test('Test _loadCredential', function (assert) { });
QUnit.test('Test _deleteCredential', function (assert) { });
QUnit.test('Test _confirmDelete', function (assert) { });
QUnit.test('Test _generatePasswordHash', function (assert) { });
QUnit.test('Test _generatePasswordHash64', function (assert) { });
QUnit.test('Test _changePassword', function (assert) { });
QUnit.test('Test _exportData', function (assert) { });
QUnit.test('Test _options', function (assert) { });
QUnit.test('Test _buildDataTable', function (assert) { });
QUnit.test('Test _createCredentialTable', function (assert) { });
QUnit.test('Test _createCredentialTableRow', function (assert) { });
QUnit.test('Test _validateRecord', function (assert) { });
QUnit.test('Test _utf8_to_b64', function (assert) { });
QUnit.test('Test _b64_to_utf8', function (assert) { });
QUnit.test('Test _contains', function (assert) { });
QUnit.test('Test _truncate', function (assert) { });
QUnit.test('Test _search', function (assert) { });
QUnit.test('Test _debounce', function (assert) { });
QUnit.test('Test _sortCredentials', function (assert) { });
QUnit.test('Test _init', function (assert) { });