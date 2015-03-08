using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.ComponentModel;

namespace Vault.Models
{
    public class CredentialListViewModel
    {
        public string CredentialID { get; set; }
        public string UserID { get; set; }
        public string Description { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
    }
}