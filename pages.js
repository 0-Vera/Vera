
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>Ayarlar</title>
</head>
<body>
<h1>Site Ayarları</h1>
<input id="siteTitle" placeholder="Site başlığı">
<button onclick="save()">Kaydet</button>
<script>
async function save(){
 const res=await fetch("/api/settings",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({siteTitle:siteTitle.value})});
 const data=await res.json();
 alert(JSON.stringify(data));
}
</script>
</body>
</html>
