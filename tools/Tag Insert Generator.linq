<Query Kind="Program">
  <RuntimeVersion>8.0</RuntimeVersion>
</Query>

void Main()
{
	var tags = new[] {
		"tag1",
		"tag2",
	};
	
	var userID = "REPLACE-WITH-USER-GUID";
	
	var sql = $"""
		INSERT INTO Tags 
			(TagID, UserID, Label) 
		VALUES 
			{string.Join("," + Environment.NewLine, tags.Select(t => $"('{Guid.NewGuid()}', '{userID}', '{t}')"))}
		""";
	
	sql.Dump();
}
