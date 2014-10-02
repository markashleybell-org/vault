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
    assert.ok(copyLink.find('param[name="FlashVars"]').attr('value') == 'text=http%3A%2F%2Fwww.test.com');
});

QUnit.test('Test _encryptObject', function (assert) { });
QUnit.test('Test _decryptObject', function (assert) { });
QUnit.test('Test _removeFromList', function (assert) { });
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