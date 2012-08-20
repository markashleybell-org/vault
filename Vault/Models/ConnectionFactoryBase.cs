using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;

namespace Vault.Models
{
    public abstract class ConnectionFactoryBase
    {
        protected string _connectionString;

        public ConnectionFactoryBase(string connectionString)
        {
            _connectionString = connectionString;
        }

        public abstract IDbConnection GetConnection();
    }
}