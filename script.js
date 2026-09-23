let BANK={};
const LETTERS=["A","B","C","D","E","F","G","H","I"];

let set=[],i=0,score=0,scored=0,states=[];
let quizStarted=false;

const $=id=>document.getElementById(id),
 subject=$("subject"),
 year=$("year"),
 order=$("order"),
 badges=$("badges"),
 prog=$("prog"),
 scoreEl=$("score"),
 bar=$("bar"),
 meta=$("meta"),
 question=$("question"),
 answers=$("answers"),
 feedback=$("feedback"),
 prev=$("prev"),
 next=$("next"),
 restart=$("restart"),
 quiz=$("quiz"),
 finish=$("finish"),
 final=$("final"),
 again=$("again");


/* =========================================================
   GOOGLE ANALYTICS TRACKING
   ========================================================= */

function track(eventName,params={}){
  // The quiz still works if Google Analytics is blocked.
  if(typeof gtag==="function"){
    gtag("event",eventName,params);
  }
}

function quizContext(){
  return{
    quiz_part:"Part Two",
    quiz_subject:subject.value,
    exam_year:year.value,
    question_order:order.value,
    total_questions:set.length
  };
}


/* =========================================================
   HELPERS
   ========================================================= */

function esc(s){
  return String(s ?? "").replace(/[&<>"']/g,c=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    "\"":"&quot;",
    "'":"&#039;"
  }[c]));
}

function shuffle(a){
  const b=a.slice();

  for(let x=b.length-1;x>0;x--){
    const j=Math.floor(Math.random()*(x+1));
    [b[x],b[j]]=[b[j],b[x]];
  }

  return b;
}

function setLoadingState(message="Loading questions…"){
  subject.disabled=true;
  year.disabled=true;
  order.disabled=true;
  restart.disabled=true;
  next.disabled=true;
  prev.disabled=true;

  subject.innerHTML=`<option>${esc(message)}</option>`;
  year.innerHTML=`<option>Please wait…</option>`;
  badges.innerHTML="";
  meta.textContent="";
  question.textContent=message;
  answers.innerHTML="";
  feedback.hidden=true;
}

function setLoadError(error){
  subject.disabled=true;
  year.disabled=true;
  order.disabled=true;
  restart.disabled=true;
  next.disabled=true;
  prev.disabled=true;

  subject.innerHTML=`<option>Could not load questions</option>`;
  year.innerHTML=`<option>Unavailable</option>`;

  question.textContent="The question bank could not be loaded.";
  answers.innerHTML="";

  feedback.hidden=false;
  feedback.innerHTML=
    `<strong class="bad">The quiz data did not load.</strong><br><br>`+
    `Make sure <code>question-bank.json</code> is uploaded in the same GitHub repository folder as `+
    `<code>index.html</code> and <code>script.js</code>.<br><br>`+
    `<span class="ref">${esc(error && error.message ? error.message : error)}</span>`;

  track("data_load_failed",{
    quiz_part:"Part Two",
    error_message:String(error && error.message ? error.message : error).slice(0,100)
  });
}


/* =========================================================
   LOAD QUESTION BANK
   ========================================================= */

async function loadQuestionBank(){
  setLoadingState();

  try{
    const response=await fetch("./question-bank.json",{cache:"no-store"});

    if(!response.ok){
      throw new Error(`question-bank.json returned HTTP ${response.status}`);
    }

    const rows=await response.json();

    if(!Array.isArray(rows) || rows.length===0){
      throw new Error("question-bank.json does not contain a non-empty question array");
    }

    BANK={};

    for(const item of rows){
      const sub=item.subject || "Other";

      if(!BANK[sub]){
        BANK[sub]=[];
      }

      BANK[sub].push(item);
    }

    subject.disabled=false;
    year.disabled=false;
    order.disabled=false;
    restart.disabled=false;

    initSubjects();

    track("question_bank_loaded",{
      quiz_part:"Part Two",
      total_questions:rows.length,
      total_subjects:Object.keys(BANK).length
    });

  }catch(error){
    console.error("Failed to load CLPE Part Two question bank:",error);
    setLoadError(error);
  }
}


/* =========================================================
   FILTERS
   ========================================================= */

function initSubjects(){
  const total=Object.values(BANK).reduce((n,a)=>n+a.length,0);

  subject.innerHTML="";

  const all=document.createElement("option");
  all.value="ALL";
  all.textContent=`All subjects (${total})`;
  subject.appendChild(all);

  for(const [name,arr] of Object.entries(BANK)){
    const opt=document.createElement("option");
    opt.value=name;
    opt.textContent=`${name} (${arr.length})`;
    subject.appendChild(opt);
  }

  refreshYears(false);
}

function selectedBase(){
  if(subject.value==="ALL"){
    return Object.entries(BANK).flatMap(
      ([sub,a])=>a.map(x=>({...x,sub}))
    );
  }

  return (BANK[subject.value] || []).map(
    x=>({...x,sub:subject.value})
  );
}

function refreshYears(trackChange=true){
  const base=selectedBase();

  const ys=[...new Set(
    base
      .map(x=>x.year)
      .filter(y=>y!==null && y!==undefined && y!=="")
  )].sort((a,b)=>Number(b)-Number(a));

  year.innerHTML="";

  const all=document.createElement("option");
  all.value="ALL";
  all.textContent="All years";
  year.appendChild(all);

  for(const y of ys){
    const opt=document.createElement("option");
    opt.value=String(y);
    opt.textContent=String(y);
    year.appendChild(opt);
  }

  if(trackChange){
    track("subject_selected",{
      quiz_part:"Part Two",
      selected_subject:subject.value
    });
  }

  build();
}


/* =========================================================
   QUIZ
   ========================================================= */

function build(){
  let base=selectedBase();

  if(year.value!=="ALL"){
    base=base.filter(x=>String(x.year)===year.value);
  }

  set=order.value==="shuffle"
    ?shuffle(base)
    :base.slice().sort((a,b)=>
      Number(a.year)-Number(b.year) ||
      Number(a.num)-Number(b.num)
    );

  i=0;
  score=0;
  scored=0;
  states=set.map(()=>null);
  quizStarted=false;

  quiz.hidden=false;
  finish.hidden=true;

  const c={validated:0,corrected:0,flagged:0};

  set.forEach(x=>{
    if(Object.prototype.hasOwnProperty.call(c,x.status)){
      c[x.status]++;
    }
  });

  badges.innerHTML=
    `<span class="badge">${set.length} questions</span>`+
    `<span class="badge">${c.validated} validated</span>`+
    `<span class="badge">${c.corrected} corrected</span>`+
    `<span class="badge">${c.flagged} flagged/unscored</span>`;

  render();
}

function render(){
  if(!set.length){
    prog.textContent="Question 0 of 0";
    scoreEl.textContent="Score: 0 / 0";
    bar.style.width="0%";
    meta.textContent="";
    question.textContent="No questions in this selection.";
    answers.innerHTML="";
    feedback.hidden=true;
    prev.disabled=true;
    next.disabled=true;
    return;
  }

  const x=set[i],
        st=states[i];

  prog.textContent=`Question ${i+1} of ${set.length}`;
  scoreEl.textContent=`Score: ${score} / ${scored}`;
  bar.style.width=`${((i+1)/set.length)*100}%`;

  const lab=
    x.status==="corrected"
      ?"Corrected"
      :x.status==="flagged"
      ?"Flagged / unscored"
      :"Validated";

  meta.innerHTML=
    `${esc(x.sub)} • ${esc(x.year)} • Q${esc(x.num)} `+
    `<span class="status">${lab}</span>`;

  question.textContent=x.q || "";

  answers.innerHTML="";
  feedback.hidden=true;
  feedback.innerHTML="";

  prev.disabled=i===0;

  const opts=Array.isArray(x.options) ? x.options : [];

  opts.forEach((o,j)=>{
    const b=document.createElement("button");

    b.className="answer";
    b.type="button";
    b.textContent=`${LETTERS[j]||j+1}. ${o}`;

    if(st){
      b.disabled=true;

      if(x.answer!==null && x.answer!==undefined && j===x.answer){
        b.classList.add("correct");
      }

      if(x.answer!==null && x.answer!==undefined &&
         j===st.choice && j!==x.answer){
        b.classList.add("wrong");
      }
    }

    b.addEventListener("click",()=>choose(j));
    answers.appendChild(b);
  });

  if(st){
    show(x,st);
  }

  next.disabled=false;
  next.textContent=i===set.length-1 ? "Finish" : "Next";
}

function choose(choice){
  if(states[i]) return;

  const x=set[i];

  if(!quizStarted){
    quizStarted=true;

    track("quiz_started",{
      ...quizContext(),
      starting_subject:x.sub,
      starting_year:String(x.year)
    });
  }

  let result;

  if(x.answer===null || x.answer===undefined){
    states[i]={choice,flag:true};
    result="unscored";

  }else{
    const ok=choice===x.answer;

    states[i]={choice,ok};
    scored++;

    if(ok){
      score++;
    }

    result=ok ? "correct" : "incorrect";
  }

  track("question_answered",{
    ...quizContext(),
    question_id:String(x.id),
    question_number:i+1,
    question_subject:x.sub,
    question_year:String(x.year),
    question_status:x.status,
    answer_result:result
  });

  render();
}


/* =========================================================
   RESET ONLY THE CURRENT WRONG QUESTION
   ========================================================= */

function resetCurrentQuestion(){
  const x=set[i];
  const st=states[i];

  if(!st) return;

  if(x.answer===null || x.answer===undefined || st.ok){
    return;
  }

  track("question_reset",{
    ...quizContext(),
    question_id:String(x.id),
    question_number:i+1,
    question_subject:x.sub,
    question_year:String(x.year),
    previous_result:"incorrect"
  });

  scored=Math.max(0,scored-1);

  states[i]=null;
  render();
}

function show(x,st){
  feedback.hidden=false;

  if(x.answer===null || x.answer===undefined){
    feedback.innerHTML=
      `<strong class="warn">⚠ This item is not scored.</strong>`+
      `<br><br><strong>Why:</strong> ${esc(x.explanation)}`+
      `<div class="evidence">`+
      `<strong>Book 2 evidence:</strong> ${esc(x.evidence)}`+
      `<span class="ref">Local Preachers Book 2, p. ${esc(x.syllabus_page)}</span>`+
      `</div>`;

    return;
  }

  const ans=(x.options || [])[x.answer];

  const head=st.ok
    ?`<strong class="good">✓ Correct.</strong>`
    :`<strong class="bad">✗ Incorrect.</strong>`;

  const note=x.status==="corrected"
    ?`<br><span class="warn"><strong>Correction:</strong> `+
     `This differs from or repairs the old paper/key after checking Book 2.</span>`
    :"";

  const retry=!st.ok
    ?`<div class="retry-row">`+
     `<button id="retryQuestion" class="retry-question" type="button">`+
     `↻ Try this question again</button></div>`
    :"";

  feedback.innerHTML=
    `${head}<br>`+
    `<strong>Verified answer: ${LETTERS[x.answer]||x.answer+1}. ${esc(ans)}</strong>`+
    `${note}<br><br>`+
    `<strong>Why this is correct:</strong><br>${esc(x.explanation)}`+
    `<div class="evidence">`+
    `<strong>Book 2 evidence:</strong> ${esc(x.evidence)}`+
    `<span class="ref">Local Preachers Book 2, p. ${esc(x.syllabus_page)}</span>`+
    `</div>${retry}`;

  const retryButton=document.getElementById("retryQuestion");

  if(retryButton){
    retryButton.addEventListener("click",resetCurrentQuestion);
  }
}


/* =========================================================
   NAVIGATION + ANALYTICS
   ========================================================= */

next.addEventListener("click",()=>{
  if(i<set.length-1){
    i++;
    render();

  }else{
    const percentage=scored>0
      ?Number(((score/scored)*100).toFixed(1))
      :0;

    track("quiz_completed",{
      ...quizContext(),
      quiz_score:score,
      scored_questions:scored,
      answered_questions:states.filter(Boolean).length,
      quiz_percentage:percentage
    });

    quiz.hidden=true;
    finish.hidden=false;

    final.textContent=
      `You scored ${score} out of ${scored} scored questions. `+
      `Flagged questions were excluded.`;
  }
});

prev.addEventListener("click",()=>{
  if(i>0){
    i--;
    render();
  }
});

restart.addEventListener("click",()=>{
  track("quiz_restarted",{
    ...quizContext(),
    restart_source:"quiz",
    questions_answered:states.filter(Boolean).length
  });

  build();
});

again.addEventListener("click",()=>{
  track("quiz_restarted",{
    ...quizContext(),
    restart_source:"completion"
  });

  build();
});

subject.addEventListener("change",()=>{
  refreshYears(true);
});

year.addEventListener("change",()=>{
  track("exam_year_selected",{
    quiz_part:"Part Two",
    selected_year:year.value,
    selected_subject:subject.value
  });

  build();
});

order.addEventListener("change",()=>{
  track("question_order_changed",{
    quiz_part:"Part Two",
    selected_order:order.value,
    selected_subject:subject.value,
    selected_year:year.value
  });

  build();
});


/* =========================================================
   START
   ========================================================= */

loadQuestionBank();