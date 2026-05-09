from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 一旦すべてを許可（公開後はVercelのURLにするのが安全）
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
            # 前か後のどちらかが漢字([一-龠])なら、漢字のまま
            if (before and re.match(r'[一-龠]', before)) or (after and re.match(r'[一-龠]', after)):
                return before + "事" + after
            return before + "こと" + after

        # 1文字以上の前後関係をチェック
        text = re.sub(r'(.?)事(.?)', replace_koto, text)
        
    # 4. 時 → とき（熟語・数字＋時を保護）
    if rules.get("tokiToToki"):
        def replace_toki(match):
            before = match.group(1)
            after = match.group(2)
            
            # 保護するパターン（変換しない条件）:
            # 1. 前か後が漢字（時間、一時の、など）
            # 2. 前が数字（7時、12時、など）
            is_kanji = r'[一-龠]'
            is_digit = r'[0-9０-９]'
            
            if (before and re.match(is_kanji, before)) or \
               (after and re.match(is_kanji, after)) or \
               (before and re.match(is_digit, before)):
                return before + "時" + after
            
            # それ以外（～した時、時によると、など）は「とき」に変換
            return before + "とき" + after

        # 前後1文字ずつ含めて検索
        text = re.sub(r'(.?)時(.?)', replace_toki, text)
    
    # 5. 方 → ほう（熟語を保護）
    if rules.get("hoToHo"):
        def replace_ho(match):
            before = match.group(1)
            after = match.group(2)
            is_kanji = r'[一-龠]'
            
            # 前か後のどちらかが漢字なら、そのまま「方」を返す
            if (before and re.match(is_kanji, before)) or (after and re.match(is_kanji, after)):
                return before + "方" + after
            
            # それ以外（〜の方、方角は「ほう」にしないが「〜のほう」など）は「ほう」に変換
            return before + "ほう" + after

        text = re.sub(r'(.?)方(.?)', replace_ho, text)

# 6. 後 → あと（熟語を保護）
    if rules.get("atoToAto"):
        def replace_ato(match):
            before = match.group(1)
            after = match.group(2)
            is_kanji = r'[一-龠]'
            
            # 前か後のどちらかが漢字なら、そのまま「後」を返す（後日、午後、前後など）
            if (before and re.match(is_kanji, before)) or (after and re.match(is_kanji, after)):
                return before + "後" + after
            
            # それ以外（〜した後、その後、など）は「あと」に変換
            return before + "あと" + after

        text = re.sub(r'(.?)後(.?)', replace_ato, text)
        
    return {"result": text}