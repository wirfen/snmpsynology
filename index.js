var mysql = require("mysql");
var snmp = require('snmp-native');

var con = mysql.createConnection({
	host: "IP_SYNOLOGY",
	database: "DATABASE",
	port: "3307",
	user: "USUARIO",
	password: "CONTRASENA"
});

var session = new snmp.Session({ host: 'IP_SYNOLOGY', port: 161, community: 'COMUNIDAD' });
var entrada=0;
var salida=0;

var oids = [[1,3,6,1,4,1,6574,1,1,0], // 00 systemStatus
	[1,3,6,1,4,1,6574,1,2,0],           // 01 temperature
	[1,3,6,1,4,1,6574,2,1,1,5,0],		    // 02 diskStatus 1
	[1,3,6,1,4,1,6574,2,1,1,5,1],		    // 03 diskStatus 2
	[1,3,6,1,4,1,6574,2,1,1,6,0],		    // 04 diskTemperature1
	[1,3,6,1,4,1,6574,2,1,1,6,1],		    // 05 diskTemperature2
	[1,3,6,1,4,1,6574,3,1,1,4,0],		    // 06 raidFreeSize
	[1,3,6,1,4,1,2021,11,9,0],		      // 07 ssCpuUser
	[1,3,6,1,4,1,2021,11,10,0],		      // 08 ssCpuSystem
	[1,3,6,1,4,1,2021,4,6,0],		        // 09 memAvailFree
	[1,3,6,1,2,1,31,1,1,1,6,3],		      // 10 ifHCInOctets (bits)
	[1,3,6,1,2,1,31,1,1,1,10,3],		    // 11 ifHCOutOctets (bits)
	[1,3,6,1,4,1,6574,102,1,1,8,1],	    // 12 spaceIOLA (%)
	[1,3,6,1,4,1,6574,6,1,1,3,1],		    // 13 users CIFS
	[1,3,6,1,4,1,6574,6,1,1,3,2],		    // 14 users AFP
	[1,3,6,1,4,1,6574,6,1,1,3,3],		    // 15 users NFS
	[1,3,6,1,4,1,6574,6,1,1,3,4],		    // 16 users FTP
	[1,3,6,1,4,1,6574,6,1,1,3,5],		    // 17 users SFTP
	[1,3,6,1,4,1,6574,6,1,1,3,6],		    // 18 users HTTP/HTTPS
	[1,3,6,1,4,1,6574,6,1,1,3,7],		    // 19 users TELNET
	[1,3,6,1,4,1,6574,6,1,1,3,8],		    // 20 users SSH
	[1,3,6,1,4,1,6574,6,1,1,3,9], 	    // 21 users OTHERS
	[1,3,6,1,4,1,6574,4,2,1,0],		      // 22 upsInfoStatus (On Line, Low Battery, Shutdown Load, Cable Power, Clear to Send, Ready to send, Data Carrier Detected, Ring indicate, Data Terminal Ready, Send a BREAK)
	[1,3,6,1,4,1,6574,4,2,12,1,0],	    // 23 upsInfoLoadValue (%)
	[1,3,6,1,4,1,6574,4,3,1,1,0]];	    // 24 upsBatteryChargeValue (%)

setInterval(function() {
	session.getAll({ oids: oids }, function (varbinds) {
		con.query("INSERT INTO medidas (systemStatus, temperature, diskStatus1, diskStatus2, diskTemperature1, diskTemperature2, raidFreeSize, ssCpuTotal, memAvailFree, ifHCInOctets, ifHCOutOctets, spaceIOLA, users, upsInfoStatus, upsInfoLoadValue, upsBatteryChargeValue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [varbinds[0].value, varbinds[1].value, varbinds[2].value, varbinds[3].value, varbinds[4].value, varbinds[5].value, varbinds[6].value, varbinds[7].value + varbinds[8].value, varbinds[9].value, varbinds[10].value - entrada, varbinds[11].value - salida, varbinds[12].value, varbinds[13].value + varbinds[14].value + varbinds[15].value + varbinds[16].value + varbinds[17].value + varbinds[18].value + varbinds[19].value + varbinds[20].value + varbinds[21].value, varbinds[22].value, parseFloat(varbinds[23].value), parseFloat(varbinds[24].value)], function() {
			entrada = varbinds[10].value;
			salida = varbinds[11].value;
		});
	});
}, 5000)

function parseFloat(str) {
	var float = 0, sign, mantissa,exp,int = 0, multi = 1;
	if (/^0x/.exec(str)) {
		int = parseInt(str,16);
	}else{
		for (var i = str.length -1; i >=0; i -= 1) {
			if (str.charCodeAt(i)>255) {
				console.log('Wrong string parametr'); 
				return false;
			}
			int += str.charCodeAt(i) * multi;
			multi *= 256;
		}
	}
	sign = (int>>>31)?-1:1;
	exp = (int >>> 23 & 0xff) - 127;
	mantissa = ((int & 0x7fffff) + 0x800000).toString(2);
	for (i=0; i<mantissa.length; i+=1){
		float += parseInt(mantissa[i])? Math.pow(2,exp):0;
		exp--;
	}
	return float*sign;
}
