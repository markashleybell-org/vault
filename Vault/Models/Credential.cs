using System;
using System.ComponentModel;
using System.Linq;

namespace Vault.Models
{
    public class Credential
    {
        public Credential()
        {
            CredentialID = "{{CredentialID}}";
            UserID = "{{UserID}}";
            Description = "{{Description}}";
            Username = "{{Username}}";
            Password = "{{Password}}";
            Url = "{{Url}}";
            UserDefined1Label = "{{UserDefined1Label}}";
            UserDefined1 = "{{UserDefined1}}";
            UserDefined2Label = "{{UserDefined2Label}}";
            UserDefined2 = "{{UserDefined2}}";
            Notes = "{{Notes}}";
            PwdOptions = "{{PwdOptions}}";
            Tags = "{{Tags}}";
        }

        public string CredentialID { get; set; }

        public string UserID { get; set; }

        [DisplayName("Description")]
        public string Description { get; set; }

        public string Username { get; set; }

        public string Password { get; set; }

        public string Url { get; set; }

        [DisplayName("Custom 1 Label")]
        public string UserDefined1Label { get; set; }

        [DisplayName("Custom 1")]
        public string UserDefined1 { get; set; }

        [DisplayName("Custom 2 Label")]
        public string UserDefined2Label { get; set; }

        [DisplayName("Custom 2")]
        public string UserDefined2 { get; set; }

        public string Notes { get; set; }

        public string PwdOptions { get; set; }

        public string Tags { get; set; }

        public string TagDisplay { get; set; }

        public object[] TagArray =>
            Tags?
                .Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(t => new { TagID = t, CredentialID }).ToArray() ?? [];

        public Credential WithNewID()
        {
            var credentialWithGuid = (Credential)MemberwiseClone();
            credentialWithGuid.CredentialID = Guid.NewGuid().ToString();
            return credentialWithGuid;
        }
    }
}
