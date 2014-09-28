﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using System.Data.SQLite;

namespace Vault.Models
{
    public class SQLiteConnectionFactory : ConnectionFactoryBase
    {
        public SQLiteConnectionFactory(string connectionString) : base(connectionString) { }

        public override IDbConnection GetConnection()
        {
            return new SQLiteConnection(_connectionString);
        }
    }
}