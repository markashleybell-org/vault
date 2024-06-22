using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json.Serialization;
using Vault.Models;
using Vault.Support;

namespace Vault
{
    public class Startup
    {
        public Startup(IConfiguration configuration) =>
            Configuration = configuration;

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.Configure<Settings>(Configuration);

            services.Configure<CookiePolicyOptions>(options => {
                options.MinimumSameSitePolicy = SameSiteMode.Strict;
                options.HttpOnly = HttpOnlyPolicy.Always;
                options.Secure = CookieSecurePolicy.Always;
            });

            services.AddHsts(options => options.MaxAge = TimeSpan.FromDays(365));

            services.AddMvc(options => options.Filters.Add<ProtectWithSecurityKeyFilter>());

            SqlStatements.DatabaseType = Configuration["DbType"] == "SQLite" ? DatabaseType.SQLite : DatabaseType.SqlServer;

            var connectionString = Configuration.GetConnectionString("Main");

            var connectionFactory = SqlStatements.DatabaseType == DatabaseType.SQLite
                ? new Func<IServiceProvider, IConnectionFactory>(_ => new SQLiteConnectionFactory(connectionString))
                : _ => new SqlConnectionFactory(connectionString);

            services.AddScoped(connectionFactory);

            services.AddControllersWithViews()
                .AddNewtonsoftJson(options => options.SerializerSettings.ContractResolver = new DefaultContractResolver());
        }

#pragma warning disable SA1204 // Static elements should appear before instance elements
        public static void Configure(IApplicationBuilder app, IHostEnvironment env)
#pragma warning restore SA1204 // Static elements should appear before instance elements
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
                app.UseHsts();
            }

            app.UseStaticFiles();

            app.UseRouting();

            app.UseCookiePolicy();

            app.UseEndpoints(endpoints => endpoints.MapDefaultControllerRoute());
        }
    }
}
