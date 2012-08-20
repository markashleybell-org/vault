using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Ninject.Modules;
using Ninject.Web.Common;
using System.Configuration;

namespace Vault.Models
{
    public class NinjectBindings : NinjectModule
    {
        public override void Load()
        {
            Bind<ConnectionFactoryBase>().To<SqlConnectionFactory>()
                                         .InRequestScope()
                                         .WithConstructorArgument("connectionString", ConfigurationManager.ConnectionStrings["Vault"].ConnectionString);
        }
    }
}