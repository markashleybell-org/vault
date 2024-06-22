using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Vault.Models;
using Vault.Support;

namespace Vault.Controllers
{
    public class CredentialsController : Controller
    {
        private readonly SqlExecutor _db;

        public CredentialsController(IConnectionFactory cf) =>
            _db = new SqlExecutor(cf);

        public async Task<ActionResult> ReadTagIndex(string userId) =>
            await _db.ResultAsJson(async conn => {
                var reader = await conn.QueryMultipleAsync(SqlStatements.TagIndex, new { UserID = userId });

                var tags = await reader.ReadAsync<(string TagID, string Label)>();
                var index = await reader.ReadAsync<(string TagID, string CredentialID)>();

                return new {
                    tags = tags.Select(t => new {
                        t.TagID,
                        t.Label,
                    }),
                    index = index
                        .GroupBy(i => i.TagID)
                        .ToDictionary(g => g.Key, g => g.Select(i => i.CredentialID))
                };
            });

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] Credential model) =>
            await _db.ResultAsJson(async conn => {
                var c = model.WithNewID();
                var a = await conn.ExecuteAsync(SqlStatements.Insert, c);
                var b = await conn.ExecuteAsync(SqlStatements.TagsToCredential, c.TagArray);
                return a + b;
            });

        public async Task<ActionResult> Read(string id) =>
            await _db.ResultAsJson(async conn => {
                var reader = await conn.QueryMultipleAsync(SqlStatements.SelectSingle, new { CredentialID = id });

                var credential = await reader.ReadSingleAsync<Credential>();
                var tags = await reader.ReadAsync<(string TagID, string Label)>();

                credential.Tags = string.Join('|', tags.Select(t => t.TagID));
                credential.TagDisplay = string.Join('|', tags.Select(t => t.Label));

                return credential;
            });

        public async Task<ActionResult> ReadAll(string userId) =>
            await _db.ResultAsJson(conn => conn.QueryAsync<Credential>(SqlStatements.Select, new { UserID = userId }));

        public async Task<ActionResult> ReadSummaries(string userId) =>
            await _db.ResultAsJson(conn => conn.QueryAsync<CredentialSummary>(SqlStatements.SelectSummary, new { UserID = userId }));

        [HttpPost]
        public async Task<ActionResult> Update([FromBody] Credential model) =>
            await _db.ResultAsJson(async conn => {
                var a = await conn.ExecuteAsync(SqlStatements.Update, model);
                var b = await conn.ExecuteAsync(SqlStatements.DeleteTagsFromCredential, model);
                var c = await conn.ExecuteAsync(SqlStatements.TagsToCredential, model.TagArray);
                return a + b + c;
            });

        [HttpPost]
        public async Task<ActionResult> Import([FromBody] ImportViewModel model) =>
            await _db.ResultAsJson(async (conn, tran) => {
                foreach (var credential in model.Credentials)
                {
                    credential.CredentialID = Guid.NewGuid().ToString();
                    await conn.ExecuteAsync(SqlStatements.Insert, credential, tran);
                }

                return Json(new { done = true });
            });

        [HttpPost]
        public async Task<ActionResult> Delete([FromBody] DeleteCredentialViewModel model) =>
            await _db.ResultAsJson(conn => conn.ExecuteAsync(SqlStatements.Delete, new { model.UserID, model.CredentialID }));
    }
}
