using System.Web;
using System.Web.Optimization;

namespace Vault
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/Content/Js/bundle").Include(
                      "~/Content/Js/bootstrap.js",
                      "~/Content/Js/passpack-v1.1.js",
                      "~/Content/Js/handlebars-v1.3.0.js",
                      "~/Content/Js/main.js"));

            bundles.Add(new ScriptBundle("~/Content/Js/test").Include(
                      "~/Content/Js/qunit-1.15.0.js",
                      "~/Content/Js/blanket.js",
                      "~/Content/Js/tests.js"));

            bundles.Add(new StyleBundle("~/Content/Css/bundle").Include(
                      "~/Content/Css/bootstrap.css",
                      "~/Content/Css/main.css"));

            bundles.Add(new StyleBundle("~/Content/Css/test").Include(
                      "~/Content/Css/qunit-1.15.0.css"));
        }
    }
}
