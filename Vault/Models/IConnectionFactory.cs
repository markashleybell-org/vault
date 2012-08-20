using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data;

namespace Vault.Models
{
    public interface IConnectionFactory
    {
        IDbConnection GetConnection();
    }
}
