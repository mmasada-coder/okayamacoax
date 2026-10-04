const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");
const tools = require("../assets/js/content-tools.js");
const sha = "a".repeat(40);
const columns = [{id:"col-001", title:"既存記事", date:"2026-07-09", category:"コラム", excerpt:"概要", body:[{type:"p",text:"既存本文"}]}];
const event = {id:"evt-next",title:"次回",date:"",type:"オンライン",note:"日程調整中"};
const bundle = () => ({baseCommit:sha,generatedOn:"2026-10-04",column:null,events:[],line:{announcement:"告知",note:"ノート",eventDescription:"説明"},sources:["確認済み資料"],assumptions:[],confirmations:[]});
test("calendar rejects normalized impossible dates, accepts leap days", () => {
  assert.equal(tools.day("2026-02-29"), false); assert.equal(tools.day("2028-02-29"), true);
  assert.equal(tools.day("2026-04-31"), false); assert.equal(tools.day("2026-10-04"), true);
});
test("event dates require Japan offset, seconds 00 and valid hours", () => {
  assert.equal(tools.eventDate(""), true);
  assert.equal(tools.eventDate("2026-10-04T19:30:00+09:00"), true);
  for (const d of ["2026-10-04T24:30:00+09:00","2026-10-04T19:30:01+09:00","2026-02-30T19:30:00+09:00","2026-10-04T19:30:00Z"]) assert.equal(tools.eventDate(d), false);
});
test("required fields, malformed body, invalid type and duplicate IDs fail", () => {
  assert.equal(tools.validateData(columns,[event]).length,0);
  assert.ok(tools.validateData([...columns,...columns],[event]).length);
  assert.ok(tools.validateData([{...columns[0],body:[{type:"script",text:"x"}]}],[event]).length);
  assert.ok(tools.validateData(columns,[{...event,type:"リアル"}]).length);
  assert.ok(tools.validateData(columns,[{...event,note:undefined}]).length);
});
test("completed, postponed, cancelled, past and malformed events are hidden", () => {
  const items = [event,...["completed","postponed","cancelled"].map(status => ({...event,id:status,status})),
    {...event,id:"past",date:"2026-08-10T19:00:00+09:00"}, {...event,id:"bad",date:"broken"}];
  assert.deepEqual(tools.visibleEvents(items,Date.parse("2026-10-04T00:00:00+09:00")).map(x=>x.id),["evt-next"]);
});
test("dated events precede undated ones and lists are capped", () => {
  const later={...event,id:"later",date:"2026-10-08T19:00:00+09:00"};
  const sooner={...event,id:"sooner",date:"2026-10-07T19:00:00+09:00"};
  assert.deepEqual(tools.visibleEvents([event,later,sooner,{...event,id:"extra"}],Date.parse("2026-10-04T00:00:00+09:00")).map(x=>x.id),["sooner","later","evt-next"]);
});
test("preparation preserves existing articles, upserts events, separates drafts", () => {
  const before=JSON.stringify(columns); const b=bundle(); b.events=[{...event,title:"変更"}];
  const r=tools.prepareBundle(b,columns,[event],sha);
  assert.equal(JSON.stringify(columns),before);
  assert.equal(r.changed["data/columns.json"],undefined);
  assert.equal(JSON.parse(r.changed["data/events.json"])[0].title,"変更");
  assert.equal(r.drafts["LINE-note.txt"],"ノート");
  assert.equal(r.changed["LINE-note.txt"],undefined);
});
test("stale baseline, missing LINE copy and duplicate update IDs fail", () => {
  assert.throws(()=>tools.prepareBundle({...bundle(),baseCommit:"b".repeat(40)},columns,[event],sha));
  assert.throws(()=>tools.prepareBundle({...bundle(),line:{announcement:"告知"}},columns,[event],sha));
  assert.throws(()=>tools.prepareBundle({...bundle(),events:[event,event]},columns,[event],sha));
});
test("new column requires next ID, writing rules and complete body", () => {
  const body="合同会社リバースの正田です。"+"あ".repeat(620)+"共に、次へ。";
  const column={...columns[0],id:"col-002",body:[{type:"p",text:body}]};
  const r=tools.prepareBundle({...bundle(),column},columns,[event],sha);
  assert.deepEqual(JSON.parse(r.changed["data/columns.json"]).map(x=>x.id),["col-002","col-001"]);
  assert.throws(()=>tools.prepareBundle({...bundle(),column:{...column,id:"col-001"}},columns,[event],sha));
  assert.throws(()=>tools.prepareBundle({...bundle(),column:{...column,body:[{type:"p",text:"短い"}]}},columns,[event],sha));
  assert.throws(()=>tools.prepareBundle({...bundle(),column:{...column,body:[{type:"p",text:body.replace("あ","必ず")}]}},columns,[event],sha));
});
function context() {
  const nodes = Object.fromEntries(["events","latest-columns","article-list","article"].map(id=>[id,{innerHTML:""}]));
  const document={getElementById:id=>nodes[id],addEventListener:()=>{}};
  const ctx=vm.createContext({document,console,Intl,Date,URLSearchParams,location:{search:""},window:{}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,"../assets/js/main.js"),"utf8")+"\nglobalThis.CoAX=CoAX;",ctx);
  ctx.CoAXContent=tools;
  return {ctx,nodes};
}
test("home renders undated and Japan-time dated events, escapes text", async () => {
  const {ctx,nodes}=context();
  ctx.CoAX.loadJSON=async()=>[{...event,title:"<script>bad</script>"},{...event,id:"later",date:"2099-10-04T00:30:00+09:00"}];
  vm.runInContext(fs.readFileSync(path.join(__dirname,"../assets/js/home.js"),"utf8"),ctx);
  await ctx.renderEvents();
  assert.match(nodes.events.innerHTML,/日程.*調整中/s);
  assert.match(nodes.events.innerHTML,/2099\.10/);
  assert.match(nodes.events.innerHTML,/&lt;script&gt;/);
  assert.doesNotMatch(nodes.events.innerHTML,/<script>/);
});
test("Japan time and date-only articles do not shift days", () => {
  const {ctx}=context();
  assert.equal(ctx.CoAX.formatDate("2026-10-04T00:30:00+09:00",true),"2026年10月4日(日) 00:30");
  assert.equal(ctx.CoAX.formatDate("2026-10-04"),"2026年10月4日(日)");
  assert.equal(ctx.CoAX.formatDate("2026-10-03T15:30:00Z",true),"2026年10月4日(日) 00:30");
});
test("load failures show retry guidance, never empty or not-found states", async () => {
  const {ctx,nodes}=context(); ctx.CoAX.loadJSON=async()=>{throw new Error("offline")};
  vm.runInContext(fs.readFileSync(path.join(__dirname,"../assets/js/home.js"),"utf8"),ctx);
  await ctx.renderEvents(); assert.match(nodes.events.innerHTML,/開催予定を読み込めません/);
  await ctx.renderLatestColumns(); assert.match(nodes["latest-columns"].innerHTML,/コラムを読み込めません/);
  vm.runInContext(fs.readFileSync(path.join(__dirname,"../assets/js/columns.js"),"utf8"),ctx);
  await ctx.window.pageInit(); assert.match(nodes["article-list"].innerHTML,/読み込めません/);
  vm.runInContext(fs.readFileSync(path.join(__dirname,"../assets/js/column.js"),"utf8"),ctx);
  await ctx.window.pageInit({siteName:"おかやまCoAX"}); assert.match(nodes.article.innerHTML,/読み込めません/);
});
