/*
    PDF static-triage rules for the MAOps pipeline.
    These target structural indicators commonly seen in malicious PDFs
    (embedded JS, auto-exec actions, embedded files, obfuscation).
    Each rule carries a "severity" meta field (1-10) used by scanner.py
    to compute an aggregate risk score. Tune thresholds as you build
    out a real sample corpus.
*/

rule PDF_Contains_JavaScript
{
    meta:
        description = "PDF contains embedded JavaScript"
        severity = 6
    strings:
        $js1 = "/JavaScript" ascii
        $js2 = "/JS" ascii
    condition:
        uint32(0) == 0x46445025 and any of them // %PDF magic bytes
}

rule PDF_Auto_Execute_Action
{
    meta:
        description = "PDF has an auto-execute action on open (/OpenAction or /AA)"
        severity = 7
    strings:
        $a1 = "/OpenAction" ascii
        $a2 = "/AA" ascii
    condition:
        uint32(0) == 0x46445025 and any of them
}

rule PDF_Launch_Action
{
    meta:
        description = "PDF contains a /Launch action (can spawn external programs)"
        severity = 9
    strings:
        $launch = "/Launch" ascii
    condition:
        uint32(0) == 0x46445025 and $launch
}

rule PDF_Embedded_File
{
    meta:
        description = "PDF has an embedded file object"
        severity = 6
    strings:
        $ef1 = "/EmbeddedFile" ascii
        $ef2 = "/Filespec" ascii
    condition:
        uint32(0) == 0x46445025 and any of them
}

rule PDF_Suspicious_Filter_Chain
{
    meta:
        description = "PDF uses layered/obfuscating stream filters often used to hide payloads"
        severity = 4
    strings:
        $f1 = "/ASCIIHexDecode" ascii
        $f2 = "/ASCII85Decode" ascii
        $f3 = "/FlateDecode" ascii
    condition:
        uint32(0) == 0x46445025 and 2 of them
}

rule PDF_Object_Stream_Obfuscation
{
    meta:
        description = "PDF uses compressed object streams, sometimes used to hide structure from basic viewers"
        severity = 3
    strings:
        $objstm = "/ObjStm" ascii
    condition:
        uint32(0) == 0x46445025 and $objstm
}

rule PDF_Encrypted_Content
{
    meta:
        description = "PDF declares an /Encrypt dictionary, can be used to evade static scanners"
        severity = 5
    strings:
        $enc = "/Encrypt" ascii
    condition:
        uint32(0) == 0x46445025 and $enc
}

rule PDF_Submit_Form_Action
{
    meta:
        description = "PDF contains a /SubmitForm action, can exfiltrate data on open"
        severity = 6
    strings:
        $sf = "/SubmitForm" ascii
    condition:
        uint32(0) == 0x46445025 and $sf
}