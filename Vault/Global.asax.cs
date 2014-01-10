using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using Microsoft.Practices.Unity;
using Vault.Models;

namespace Vault
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);

            // Set up object mappings for Unity DI
            var container = new UnityContainer();

            // TODO: Look into object lifetime management
            container.RegisterType<ConnectionFactoryBase>(new HttpContextLifetimeManager<SqlConnectionFactory>(), new InjectionFactory(c => new SqlConnectionFactory(ConfigurationManager.ConnectionStrings["Vault"].ConnectionString)));

            var resolver = new UnityDependencyResolver(container);

            DependencyResolver.SetResolver(resolver);
        }
    }
}
