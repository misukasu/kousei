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
    
    if rules.get("indent"):
        lines = text.splitlines()
        new_lines = []
        for line in lines:
            if line and not (line.startswith("　") or line.startswith("「")):
                new_lines.append("　" + line)
            else:
                new_lines.append(line)
        text = "\n".join(new_lines)
        
    if rules.get("noPeriodInQuote"):
        text = text.replace("。」", "」")
        
    if rules.get("kotoToKoto"):
        def replace_koto(match):
            before = match.group(1)
            after = match.group(2)
            if (before and re.match(r'[一-龠]', before)) or (after and re.match(r'[一-龠]', after)):
                return before + "事" + after
            return before + "こと" + after
        text = re.sub(r'(.?)事(.?)', replace_koto, text)
        
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
    
    if rules.get("hoToHo"):
        def replace_ho(match):
            before = match.group(1)
            after = match.group(2)
            is_kanji = r'[一-龠]'
            if (before and re.match(is_kanji, before)) or (after and re.match(is_kanji, after)):
                return before + "方" + after
            return before + "ほう" + after
        text = re.sub(r'(.?)方(.?)', replace_ho, text)

    if rules.get("atoToAto"):
        def replace_ato(match):
            before = match.group(1)
            after = match.group(2)
            is_kanji = r'[一-龠]'
            # 【修正ポイント】
            # 1. 前後に漢字がある場合
            # 2. 後ろに「ろ」が続く場合（後ろ、後ろ姿など）
            # これらに該当する場合は「後」のままにする
            if (before and re.match(is_kanji, before)) or \
               (after and re.match(is_kanji, after)) or \
               (after == "ろ"):
                return before + "後" + after
            return before + "あと" + after
        text = re.sub(r'(.?)後(.?)', replace_ato, text)
        
    return {"result": text}