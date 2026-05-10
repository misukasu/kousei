import os
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProofreadRequest(BaseModel):
    text: str
    rules: dict

@app.post("/proofread")
async def proofread(request: ProofreadRequest):
    text = request.text
    rules = request.rules
    
    # 1. 行頭インデント
    if rules.get("indent"):
        lines = text.splitlines()
        new_lines = []
        for line in lines:
            if line and not (line.startswith("　") or line.startswith("「")):
                new_lines.append("　" + line)
            else:
                new_lines.append(line)
        text = "\n".join(new_lines)
        
    # 2. 閉じ鍵括弧直前の句点を消去
    if rules.get("noPeriodInQuote"):
        text = text.replace("。」", "」")
        
    # 3. 事 → こと
    if rules.get("kotoToKoto"):
        def replace_koto(match):
            before = match.group(1)
            after = match.group(2)
            if (before and re.match(r'[一-龠]', before)) or (after and re.match(r'[一-龠]', after)):
                return before + "事" + after
            return before + "こと" + after
        text = re.sub(r'(.?)事(.?)', replace_koto, text)
        
    # 4. 時 → とき
    if rules.get("tokiToToki"):
        def replace_toki(match):
            before = match.group(1)
            after = match.group(2)
            is_kanji = r'[一-龠]'
            is_digit = r'[0-9０-９]'
            if (before and re.match(is_kanji, before)) or \
               (after and re.match(is_kanji, after)) or \
               (before and re.match(is_digit, before)):
                return before + "時" + after
            return before + "とき" + after
        text = re.sub(r'(.?)時(.?)', replace_toki, text)
    
    # 5. 方 → ほう
    if rules.get("hoToHo"):
        def replace_ho(match):
            before = match.group(1)
            after = match.group(2)
            is_kanji = r'[一-龠]'
            if (before and re.match(is_kanji, before)) or (after and re.match(is_kanji, after)):
                return before + "方" + after
            return before + "ほう" + after
        text = re.sub(r'(.?)方(.?)', replace_ho, text)

    # 6. 後 → あと
    if rules.get("atoToAto"):
        def replace_ato(match):
            before = match.group(1)
            after = match.group(2)
            is_kanji = r'[一-龠]'
            if (before and re.match(is_kanji, before)) or (after and re.match(is_kanji, after)):
                return before + "後" + after
            return before + "あと" + after
        text = re.sub(r'(.?)後(.?)', replace_ato, text)
        
    return {"result": text}