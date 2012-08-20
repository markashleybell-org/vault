using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using System.Data.SqlClient;

namespace Vault.Models
{
    public class SqlConnectionFactory : ConnectionFactoryBase
    {
        public SqlConnectionFactory(string connectionString) : base(connectionString) { }

        public override IDbConnection GetConnection()
        {
            return new SqlConnection(_connectionString);
        }
    }
}