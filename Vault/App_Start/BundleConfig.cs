using System.Web;
using System.Web.Optimization;

namespace Vault
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/Content/Js").Include(
                      "~/Content/Js/bootstrap.js",
                      "~/Content/Js/passpack-v1.1.js",
                      "~/Content/Js/handlebars-v1.3.0.js",
                      "~/Content/Js/main.js"));

            bundles.Add(new StyleBundle("~/Content/Css").Include(
                      "~/Content/Css/bootstrap.css",
                      "~/Content/Css/main.css"));
        }
    }
}
