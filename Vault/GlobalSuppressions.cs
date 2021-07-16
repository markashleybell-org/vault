using System.Diagnostics.CodeAnalysis;

[assembly: SuppressMessage(
    "Design",
    "RCS1090: Call 'ConfigureAwait(false)'.",
    Justification = "ASP.NET core doesn't have a synchronisation context, no external usage anyway.")]

[assembly: SuppressMessage(
    "Style",
    "IDE0063: Use simple 'using' statement",
    Justification = "Makes the code far less clear.")]

[assembly: SuppressMessage(
    "Design",
    "CA1056: URI-like properties should not be strings",
    Justification = "Well, they are, so... deal with it.")]
