﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Vault.Models;
using System.Data.SQLite;
using System.Configuration;
using System.Data;

namespace Vault.Controllers
{
    public class MainController : Controller
    {
        SQLiteConnection _conn;

        public MainController()
        {
            _conn = new SQLiteConnection(ConfigurationManager.ConnectionStrings["Vault"].ConnectionString);
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Generate()
        {
            return View();
        }

        [HttpPost]
        public ActionResult GetAll(string userId)
        {
            _conn.Open();

            var cmd = new SQLiteCommand("select * from tcredential where userid = @UserID", _conn);
            cmd.Parameters.Add("@UserID", DbType.String).Value = userId;

            var credentials = new List<CredentialListViewModel>();

            using (var r = cmd.ExecuteReader())
            {
                while (r.Read())
                {
                    credentials.Add(new CredentialListViewModel {
                        CredentialID = r["CredentialID"].ToString(),
                        UserID = r["UserID"].ToString(),
                        Description = r["Description"].ToString()
                    });
                }
            }

            _conn.Close();

            return Json(credentials);
        }

        [HttpPost]
        public ActionResult Load(string id)
        {
            _conn.Open();

            var cmd = new SQLiteCommand("select * from tcredential where credentialid = @CredentialID", _conn);
            cmd.Parameters.Add("@CredentialID", DbType.String).Value = id;

            var credential = new CredentialViewModel();

            using (var r = cmd.ExecuteReader())
            {
                if (r.Read())
                {
                    credential = new CredentialViewModel
                    {
                        CredentialID = r["CredentialID"].ToString(),
                        UserID = r["UserID"].ToString(),
                        Description = r["Description"].ToString(),
                        Username = r["Username"].ToString(),
                        Password = r["Password"].ToString(),
                        PasswordConfirmation = r["Password"].ToString(),
                        Url = r["Url"].ToString(),
                        UserDefined1Label = r["UserDefined1Label"].ToString(),
                        UserDefined1 = r["UserDefined1"].ToString(),
                        UserDefined2Label = r["UserDefined2Label"].ToString(),
                        UserDefined2 = r["UserDefined2"].ToString(),
                        Notes = r["Notes"].ToString()
                    };
                }
            }

            _conn.Close();

            return Json(credential);
        }

        [HttpPost]
        public ActionResult Delete(string credentialId, string userId)
        {
            _conn.Open();

            var success = true;

            try
            {
                var cmd = new SQLiteCommand("delete from tcredential where userid = @UserID and credentialid = @CredentialID;", _conn);

                cmd.Parameters.Add("@CredentialID", DbType.String).Value = credentialId;
                cmd.Parameters.Add("@UserID", DbType.String).Value = userId;
                cmd.ExecuteNonQuery();
            }
            catch (SQLiteException exception)
            {
                // Not much can go wrong here but if it does we want to know, so eventually we
                // will pass the error info back in the JSON response
                success = false;
            }

            _conn.Close();

            return Json(new { Success = success });
        }

        [HttpPost]
        public ActionResult Update(CredentialViewModel model)
        {
            _conn.Open();

            var sql = "insert into tcredential (CredentialID, Description, Username, Password, Url, UserDefined1Label, UserDefined1, UserDefined2Label, UserDefined2, Notes, UserID) values " +
                      "(@CredentialID, @Description, @Username, @Password, @Url, @UserDefined1Label, @UserDefined1, @UserDefined2Label, @UserDefined2, @Notes, @UserID); select @CredentialID as id;";

            if (model.CredentialID != null)
            {
                sql = "update tcredential set Description = @Description, Username = @Username, Password = @Password, Url = @Url, UserDefined1Label = @UserDefined1Label, " +
                      "UserDefined1 = @UserDefined1, UserDefined2Label = @UserDefined2Label, UserDefined2 = @UserDefined2, Notes = @Notes, UserID = @UserID where credentialid = @CredentialID; select @CredentialID as id;";
            }

            var cmd = new SQLiteCommand(sql, _conn);

            cmd.Parameters.Add("@CredentialID", DbType.String).Value = (model.CredentialID == null) ? Guid.NewGuid().ToString() : model.CredentialID;
            cmd.Parameters.Add("@UserID", DbType.String).Value = model.UserID;
            cmd.Parameters.Add("@Description", DbType.String).Value = model.Description;
            cmd.Parameters.Add("@Username", DbType.String).Value = model.Username;
            cmd.Parameters.Add("@Password", DbType.String).Value = model.Password;
            cmd.Parameters.Add("@Url", DbType.String).Value = model.Url;
            cmd.Parameters.Add("@UserDefined1Label", DbType.String).Value = model.UserDefined1Label;
            cmd.Parameters.Add("@UserDefined1", DbType.String).Value = model.UserDefined1;
            cmd.Parameters.Add("@UserDefined2Label", DbType.String).Value = model.UserDefined2Label;
            cmd.Parameters.Add("@UserDefined2", DbType.String).Value = model.UserDefined2;
            cmd.Parameters.Add("@Notes", DbType.String).Value = model.Notes;

            model.CredentialID = Convert.ToString(cmd.ExecuteScalar());
                    
            _conn.Close();

            return Json(model);
        }

        [HttpPost]
        public ActionResult Login(LoginViewModel model)
        {
            _conn.Open();

            var cmd = new SQLiteCommand("select * from tuser where username = UserName and password = Password", _conn);
            cmd.Parameters.Add("@Username", DbType.String).Value = model.Username;
            cmd.Parameters.Add("@Password", DbType.String).Value = model.Password;

            var userId = "";

            using (var r = cmd.ExecuteReader())
            {
                if (r.Read())
                    userId = r["UserID"].ToString();
            }

            _conn.Close();

            return Json(new { result = ((userId != "") ? 1 : 0), id = userId });
        }
    }
}
