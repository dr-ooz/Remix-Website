(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))n(o);new MutationObserver(o=>{for(const i of o)if(i.type==="childList")for(const l of i.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function t(o){const i={};return o.integrity&&(i.integrity=o.integrity),o.referrerPolicy&&(i.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?i.credentials="include":o.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(o){if(o.ep)return;o.ep=!0;const i=t(o);fetch(o.href,i)}})();const Sn=!1,_n=(e,r)=>e===r,ue=Symbol("solid-proxy"),zr=typeof Proxy=="function",pt=Symbol("solid-track"),ht={equals:_n};let Or=Pr;const we=1,mt=2,Ir={owned:null,cleanups:null,context:null,owner:null};var H=null;let ut=null,zn=null,Z=null,re=null,ve=null,zt=0;function je(e,r){const t=Z,n=H,o=e.length===0,i=r===void 0?n:r,l=o?Ir:{owned:null,cleanups:null,context:i?i.context:null,owner:i},s=o?e:()=>e(On(l));H=l,Z=null;try{return Ue(s,!0)}finally{Z=t,H=n}}function On(e){return()=>ae(()=>rt(e))}function N(e,r){r=r?Object.assign({},ht,r):ht;const t={value:e,observers:null,observerSlots:null,comparator:r.equals||void 0},n=o=>(typeof o=="function"&&(o=o(t.value)),Mr(t,o));return[Er.bind(t),n]}function In(e,r,t){const n=It(e,r,!0,we);Ve(n)}function X(e,r,t){const n=It(e,r,!1,we);Ve(n)}function tt(e,r,t){Or=Mn;const n=It(e,r,!1,we);n.user=!0,ve?ve.push(n):Ve(n)}function V(e,r,t){t=t?Object.assign({},ht,t):ht;const n=It(e,r,!0,0);return n.observers=null,n.observerSlots=null,n.comparator=t.equals||void 0,Ve(n),Er.bind(n)}function An(e){return Ue(e,!1)}function ae(e){if(Z===null)return e();const r=Z;Z=null;try{return e()}finally{Z=r}}function Be(e){tt(()=>ae(e))}function Ot(e){return H===null||(H.cleanups===null?H.cleanups=[e]:H.cleanups.push(e)),e}function Lt(){return Z}function Ee(e,r){const t=Symbol("context");return{id:t,Provider:Tn(t),defaultValue:e}}function Me(e){let r;return H&&H.context&&(r=H.context[e.id])!==void 0?r:e.defaultValue}function Ar(e){const r=V(e),t=V(()=>Dt(r()));return t.toArray=()=>{const n=t();return Array.isArray(n)?n:n!=null?[n]:[]},t}function Cr(e){e.observerSlots=e.observers.map((r,t)=>{const n=r.sources;if(!n)return-1;for(let o=n.length-1;o>=0;o--)if(n[o]===e&&r.sourceSlots&&r.sourceSlots[o]===t)return o;return n.lastIndexOf(e)})}function Er(){if(this.sources&&this.state)if(this.state===we)Ve(this);else{const e=re;re=null,Ue(()=>bt(this),!1),re=e}if(Z){const e=this.observers;if(!e||e[e.length-1]!==Z){const r=e?e.length:0;if(Z.sources)Z.sources.push(this),Z.sourceSlots.push(r);else{const t=[this],n=[r];Z.sources=t,Z.sourceSlots=n}if(e)(!this.observerSlots||this.observerSlots.length!==e.length)&&Cr(this),e.push(Z),this.observerSlots.push(Z.sources.length-1);else{const t=[Z],n=[Z.sources.length-1];this.observers=t,this.observerSlots=n}}}return this.value}function Mr(e,r,t){let n=e.value;return(!e.comparator||!e.comparator(n,r))&&(e.value=r,e.observers&&e.observers.length&&Ue(()=>{for(let o=0;o<e.observers.length;o+=1){const i=e.observers[o],l=ut&&ut.running;l&&ut.disposed.has(i),(l?!i.tState:!i.state)&&(i.pure?re.push(i):ve.push(i),i.observers&&Tr(i)),l||(i.state=we)}if(re.length>1e6)throw re=[],new Error},!1)),r}function Ve(e){if(!e.fn)return;rt(e,!0);const r=zt;Cn(e,e.value,r)}function Cn(e,r,t){let n;const o=H,i=Z;Z=H=e;try{n=e.fn(r)}catch(l){return e.pure&&(e.state=we,e.owned&&e.owned.forEach(s=>rt(s)),e.owned=null),e.updatedAt=t+1,$r(l)}finally{Z=i,H=o}(!e.updatedAt||e.updatedAt<=t)&&(e.updatedAt!=null&&"observers"in e?Mr(e,n):e.value=n,e.updatedAt=t)}function It(e,r,t,n=we,o){const i={fn:e,state:n,updatedAt:null,owned:null,sources:null,sourceSlots:null,cleanups:null,value:r,owner:H,context:H?H.context:null,pure:t};return H===null||H!==Ir&&(H.owned?H.owned.push(i):H.owned=[i]),i}function gt(e){if(e.state===0)return;if(e.state===mt)return bt(e);if(e.suspense&&ae(e.suspense.inFallback))return e.suspense.effects.push(e);const r=[e];for(;(e=e.owner)&&(!e.updatedAt||e.updatedAt<zt);)e.state&&r.push(e);for(let t=r.length-1;t>=0;t--)if(e=r[t],e.state===we)Ve(e);else if(e.state===mt){const n=re;re=null,Ue(()=>bt(e,r[0]),!1),re=n}}function Ue(e,r){if(re)return e();let t=!1;r||(re=[]),ve?t=!0:ve=[],zt++;try{const n=e();return En(t),n}catch(n){t||(ve=null),re=null,$r(n)}}function En(e){if(re&&(Pr(re),re=null),e)return;const r=ve;ve=null,r.length&&Ue(()=>Or(r),!1)}function Pr(e){for(let r=0;r<e.length;r++)gt(e[r])}function Mn(e){let r,t=0;for(r=0;r<e.length;r++){const n=e[r];n.user?e[t++]=n:gt(n)}for(r=0;r<t;r++)gt(e[r])}function bt(e,r){e.state=0;for(let t=0;t<e.sources.length;t+=1){const n=e.sources[t];if(n.sources){const o=n.state;o===we?n!==r&&(!n.updatedAt||n.updatedAt<zt)&&gt(n):o===mt&&bt(n,r)}}}function Tr(e){for(let r=0;r<e.observers.length;r+=1){const t=e.observers[r];t.state||(t.state=mt,t.pure?re.push(t):ve.push(t),t.observers&&Tr(t))}}function rt(e,r){let t;if(e.sources)for(;e.sources.length;){const n=e.sources.pop(),o=e.sourceSlots.pop(),i=n.observers;if(i&&i.length){(!n.observerSlots||n.observerSlots.length!==i.length)&&Cr(n);const l=i.pop(),s=n.observerSlots.pop();o<i.length&&(l.sourceSlots[s]=o,i[o]=l,n.observerSlots[o]=s)}!r&&(!i||i.length)}if(e.tOwned){for(t=e.tOwned.length-1;t>=0;t--)rt(e.tOwned[t]);delete e.tOwned}if(e.owned){for(t=e.owned.length-1;t>=0;t--)rt(e.owned[t]);e.owned=null}if(e.cleanups){for(t=e.cleanups.length-1;t>=0;t--)e.cleanups[t]();e.cleanups=null}e.state=0}function Pn(e){return e instanceof Error?e:new Error(typeof e=="string"?e:"Unknown error",{cause:e})}function $r(e,r=H){throw Pn(e)}function Dt(e){if(typeof e=="function"&&!e.length)return Dt(e());if(Array.isArray(e)){const r=[];for(let t=0;t<e.length;t++){const n=Dt(e[t]);if(Array.isArray(n))if(n.length<32768)r.push.apply(r,n);else for(let o=0;o<n.length;o++)r.push(n[o]);else r.push(n)}return r}return e}function Tn(e,r){return function(n){let o;return X(()=>o=ae(()=>(H.context={...H.context,[e]:n.value},Ar(()=>n.children))),void 0),o}}const jt=Symbol("fallback");function xt(e){for(let r=0;r<e.length;r++)e[r]()}function $n(e,r,t={}){let n=[],o=[],i=[],l=0,s=r.length>1?[]:null;return Ot(()=>xt(i)),()=>{let a=e()||[],c=a.length,d,u;return a[pt],ae(()=>{let f,m,x,w,E,b,k,_,v;if(c===0)l!==0&&(xt(i),i=[],n=[],o=[],l=0,s&&(s=[])),t.fallback&&(n=[jt],o[0]=je(R=>(i[0]=R,t.fallback())),l=1);else if(l===0){for(o=new Array(c),u=0;u<c;u++)n[u]=a[u],o[u]=je(h);l=c}else{for(x=new Array(c),w=new Array(c),s&&(E=new Array(c)),b=0,k=Math.min(l,c);b<k&&n[b]===a[b];b++);for(k=l-1,_=c-1;k>=b&&_>=b&&n[k]===a[_];k--,_--)x[_]=o[k],w[_]=i[k],s&&(E[_]=s[k]);for(f=new Map,m=new Array(_+1),u=_;u>=b;u--)v=a[u],d=f.get(v),m[u]=d===void 0?-1:d,f.set(v,u);for(d=b;d<=k;d++)v=n[d],u=f.get(v),u!==void 0&&u!==-1?(x[u]=o[d],w[u]=i[d],s&&(E[u]=s[d]),u=m[u],f.set(v,u)):i[d]();for(u=b;u<c;u++)u in x?(o[u]=x[u],i[u]=w[u],s&&(s[u]=E[u],s[u](u))):o[u]=je(h);o=o.slice(0,l=c),n=a.slice(0)}return o});function h(f){if(i[u]=f,s){const[m,x]=N(u);return s[u]=x,r(a[u],m)}return r(a[u])}}}function Fn(e,r,t={}){let n=[],o=[],i=[],l=[],s=0,a;return Ot(()=>xt(i)),()=>{const c=e()||[],d=c.length;return c[pt],ae(()=>{if(d===0)return s!==0&&(xt(i),i=[],n=[],o=[],s=0,l=[]),t.fallback&&(n=[jt],o[0]=je(h=>(i[0]=h,t.fallback())),s=1),o;for(n[0]===jt&&(i[0](),i=[],n=[],o=[],s=0),a=0;a<d;a++)a<n.length&&n[a]!==c[a]?l[a](()=>c[a]):a>=n.length&&(o[a]=je(u));for(;a<n.length;a++)i[a]();return s=l.length=i.length=d,n=c.slice(0),o=o.slice(0,s)});function u(h){i[a]=h;const[f,m]=N(c[a]);return l[a]=m,r(f,a)}}}function I(e,r){return ae(()=>e(r||{}))}function lt(){return!0}const Nt={get(e,r,t){return r===ue?t:e.get(r)},has(e,r){return r===ue?!0:e.has(r)},set:lt,deleteProperty:lt,getOwnPropertyDescriptor(e,r){return{configurable:!0,enumerable:!0,get(){return e.get(r)},set:lt,deleteProperty:lt}},ownKeys(e){return e.keys()}};function Tt(e){return(e=typeof e=="function"?e():e)?e:{}}function Rn(){for(let e=0,r=this.length;e<r;++e){const t=this[e]();if(t!==void 0)return t}}function Ce(...e){let r=!1;for(let l=0;l<e.length;l++){const s=e[l];r=r||!!s&&ue in s,e[l]=typeof s=="function"?(r=!0,V(s)):s}if(zr&&r)return new Proxy({get(l){for(let s=e.length-1;s>=0;s--){const a=Tt(e[s])[l];if(a!==void 0)return a}},has(l){for(let s=e.length-1;s>=0;s--)if(l in Tt(e[s]))return!0;return!1},keys(){const l=[];for(let s=0;s<e.length;s++)l.push(...Object.keys(Tt(e[s])));return[...new Set(l)]}},Nt);const t={},n=Object.create(null);for(let l=e.length-1;l>=0;l--){const s=e[l];if(!s)continue;const a=Object.getOwnPropertyNames(s);for(let c=a.length-1;c>=0;c--){const d=a[c];if(d==="__proto__"||d==="constructor")continue;const u=Object.getOwnPropertyDescriptor(s,d);if(!n[d])n[d]=u.get?{enumerable:!0,configurable:!0,get:Rn.bind(t[d]=[u.get.bind(s)])}:u.value!==void 0?u:void 0;else{const h=t[d];h&&(u.get?h.push(u.get.bind(s)):u.value!==void 0&&h.push(()=>u.value))}}}const o={},i=Object.keys(n);for(let l=i.length-1;l>=0;l--){const s=i[l],a=n[s];a&&a.get?Object.defineProperty(o,s,a):o[s]=a?a.value:void 0}return o}function At(e,...r){const t=r.length;if(zr&&ue in e){const o=t>1?r.flat():r[0],i=new Set,l=r.map(s=>{const a=s.filter(c=>!i.has(c)&&(i.add(c),!0));return new Proxy({get(c){return a.includes(c)?e[c]:void 0},has(c){return a.includes(c)&&c in e},keys(){return a.filter(c=>c in e)}},Nt)});return l.push(new Proxy({get(s){return o.includes(s)?void 0:e[s]},has(s){return o.includes(s)?!1:s in e},keys(){return Object.keys(e).filter(s=>!o.includes(s))}},Nt)),l}const n=[];for(let o=0;o<=t;o++)n[o]={};for(const o of Object.getOwnPropertyNames(e)){let i=t;for(let a=0;a<r.length;a++)if(r[a].includes(o)){i=a;break}const l=Object.getOwnPropertyDescriptor(e,o);!l.get&&!l.set&&l.enumerable&&l.writable&&l.configurable?n[i][o]=l.value:Object.defineProperty(n[i],o,l)}return n}const Fr=e=>`Stale read from <${e}>.`;function me(e){const r="fallback"in e&&{fallback:()=>e.fallback};return V($n(()=>e.each,e.children,r||void 0))}function ft(e){const r="fallback"in e&&{fallback:()=>e.fallback};return V(Fn(()=>e.each,e.children,r||void 0))}function qe(e){const r=e.keyed,t=V(()=>e.when,void 0,void 0),n=r?t:V(t,void 0,{equals:(o,i)=>!o==!i});return V(()=>{const o=n();if(o){const i=e.children;return typeof i=="function"&&i.length>0?ae(()=>i(r?o:()=>{if(!ae(n))throw Fr("Show");return t()})):i}return e.fallback},void 0,void 0)}function Ln(e){const r=Ar(()=>e.children),t=V(()=>{const n=r(),o=Array.isArray(n)?n:[n];let i=()=>{};for(let l=0;l<o.length;l++){const s=l,a=o[l],c=i,d=V(()=>c()?void 0:a.when,void 0,void 0),u=a.keyed?d:V(d,void 0,{equals:(h,f)=>!h==!f});i=()=>c()||(u()?[s,d,a]:void 0)}return i});return V(()=>{const n=t()();if(!n)return e.fallback;const[o,i,l]=n,s=l.children;return typeof s=="function"&&s.length>0?ae(()=>s(l.keyed?i():()=>{var c;if(((c=ae(t)())==null?void 0:c[0])!==o)throw Fr("Match");return i()})):s},void 0,void 0)}function Qt(e){return e}const Dn=["allowfullscreen","async","alpha","autofocus","autoplay","checked","controls","default","disabled","formnovalidate","hidden","indeterminate","inert","ismap","loop","multiple","muted","nomodule","novalidate","open","playsinline","readonly","required","reversed","seamless","selected","adauctionheaders","browsingtopics","credentialless","defaultchecked","defaultmuted","defaultselected","defer","disablepictureinpicture","disableremoteplayback","preservespitch","shadowrootclonable","shadowrootcustomelementregistry","shadowrootdelegatesfocus","shadowrootserializable","sharedstoragewritable"],jn=new Set(["className","value","readOnly","noValidate","formNoValidate","isMap","noModule","playsInline","adAuctionHeaders","allowFullscreen","browsingTopics","defaultChecked","defaultMuted","defaultSelected","disablePictureInPicture","disableRemotePlayback","preservesPitch","shadowRootClonable","shadowRootCustomElementRegistry","shadowRootDelegatesFocus","shadowRootSerializable","sharedStorageWritable",...Dn]),Nn=new Set(["innerHTML","textContent","innerText","children"]),Gn=Object.assign(Object.create(null),{className:"class",htmlFor:"for"}),Wn=Object.assign(Object.create(null),{class:"className",novalidate:{$:"noValidate",FORM:1},formnovalidate:{$:"formNoValidate",BUTTON:1,INPUT:1},ismap:{$:"isMap",IMG:1},nomodule:{$:"noModule",SCRIPT:1},playsinline:{$:"playsInline",VIDEO:1},readonly:{$:"readOnly",INPUT:1,TEXTAREA:1},adauctionheaders:{$:"adAuctionHeaders",IFRAME:1},allowfullscreen:{$:"allowFullscreen",IFRAME:1},browsingtopics:{$:"browsingTopics",IMG:1},defaultchecked:{$:"defaultChecked",INPUT:1},defaultmuted:{$:"defaultMuted",AUDIO:1,VIDEO:1},defaultselected:{$:"defaultSelected",OPTION:1},disablepictureinpicture:{$:"disablePictureInPicture",VIDEO:1},disableremoteplayback:{$:"disableRemotePlayback",AUDIO:1,VIDEO:1},preservespitch:{$:"preservesPitch",AUDIO:1,VIDEO:1},shadowrootclonable:{$:"shadowRootClonable",TEMPLATE:1},shadowrootdelegatesfocus:{$:"shadowRootDelegatesFocus",TEMPLATE:1},shadowrootserializable:{$:"shadowRootSerializable",TEMPLATE:1},sharedstoragewritable:{$:"sharedStorageWritable",IFRAME:1,IMG:1}});function Bn(e,r){const t=Wn[e];return typeof t=="object"?t[r]?t.$:void 0:t}const Vn=new Set(["beforeinput","click","dblclick","contextmenu","focusin","focusout","input","keydown","keyup","mousedown","mousemove","mouseout","mouseover","mouseup","pointerdown","pointermove","pointerout","pointerover","pointerup","touchend","touchmove","touchstart"]),Rr=e=>V(()=>e());function Un(e,r,t){let n=t.length,o=r.length,i=n,l=0,s=0,a=r[o-1].nextSibling,c=null;for(;l<o||s<i;){if(r[l]===t[s]){l++,s++;continue}for(;r[o-1]===t[i-1];)o--,i--;if(o===l){const d=i<n?s?t[s-1].nextSibling:t[i-s]:a;for(;s<i;)e.insertBefore(t[s++],d)}else if(i===s)for(;l<o;)(!c||!c.has(r[l]))&&r[l].remove(),l++;else if(r[l]===t[i-1]&&t[s]===r[o-1]){const d=r[--o].nextSibling;e.insertBefore(t[s++],r[l++].nextSibling),e.insertBefore(t[--i],d),r[o]=t[i]}else{if(!c){c=new Map;let u=s;for(;u<i;)c.set(t[u],u++)}const d=c.get(r[l]);if(d!=null)if(s<d&&d<i){let u=l,h=1,f;for(;++u<o&&u<i&&!((f=c.get(r[u]))==null||f!==d+h);)h++;if(h>d-s){const m=r[l];for(;s<d;)e.insertBefore(t[s++],m)}else e.replaceChild(t[s++],r[l++])}else l++;else r[l++].remove()}}}const er="_$DX_DELEGATE";function qn(e,r,t,n={}){let o;return je(i=>{o=i,r===document?e():C(r,e(),r.firstChild?null:void 0,t)},n.owner),()=>{o(),r.textContent=""}}function D(e,r,t,n){let o;const i=()=>{const s=document.createElement("template");return s.innerHTML=e,s.content.firstChild},l=()=>(o||(o=i())).cloneNode(!0);return l.cloneNode=l,l}function Ke(e,r=window.document){const t=r[er]||(r[er]=new Set);for(let n=0,o=e.length;n<o;n++){const i=e[n];t.has(i)||(t.add(i),r.addEventListener(i,Jn))}}function Ge(e,r,t){t==null?e.removeAttribute(r):e.setAttribute(r,t)}function Kn(e,r,t){t?e.setAttribute(r,""):e.removeAttribute(r)}function ce(e,r){r==null?e.removeAttribute("class"):e.className=r}function yt(e,r,t,n){if(n)Array.isArray(t)?(e[`$$${r}`]=t[0],e[`$$${r}Data`]=t[1]):e[`$$${r}`]=t;else if(Array.isArray(t)){const o=t[0];e.addEventListener(r,t[0]=i=>o.call(e,t[1],i))}else e.addEventListener(r,t,typeof t!="function"&&t)}function Hn(e,r,t={}){const n=Object.keys(r||{}),o=Object.keys(t);let i,l;for(i=0,l=o.length;i<l;i++){const s=o[i];!s||s==="undefined"||r[s]||(tr(e,s,!1),delete t[s])}for(i=0,l=n.length;i<l;i++){const s=n[i],a=!!r[s];!s||s==="undefined"||t[s]===a||!a||(tr(e,s,!0),t[s]=a)}return t}function Xn(e,r,t){if(!r)return t?Ge(e,"style"):r;const n=e.style;if(typeof r=="string")return n.cssText=r;typeof t=="string"&&(n.cssText=t=void 0),t||(t={}),r||(r={});let o,i;for(i in t)r[i]==null&&n.removeProperty(i),delete t[i];for(i in r)o=r[i],o!==t[i]&&(n.setProperty(i,o),t[i]=o);return t}function te(e,r,t){t!=null?e.style.setProperty(r,t):e.style.removeProperty(r)}function Ct(e,r={},t,n){const o={};return n||X(()=>o.children=nt(e,r.children,o.children)),X(()=>typeof r.ref=="function"&&Et(r.ref,e)),X(()=>Yn(e,r,t,!0,o,!0)),o}function Et(e,r,t){return ae(()=>e(r,t))}function C(e,r,t,n){if(t!==void 0&&!n&&(n=[]),typeof r!="function")return nt(e,r,n,t);X(o=>nt(e,r(),o,t),n)}function Yn(e,r,t,n,o={},i=!1){r||(r={});for(const l in o)if(!(l in r)){if(l==="children")continue;o[l]=rr(e,l,null,o[l],t,i,r)}for(const l in r){if(l==="children")continue;const s=r[l];o[l]=rr(e,l,s,o[l],t,i,r)}}function Zn(e){return e.toLowerCase().replace(/-([a-z])/g,(r,t)=>t.toUpperCase())}function tr(e,r,t){const n=r.trim().split(/\s+/);for(let o=0,i=n.length;o<i;o++)e.classList.toggle(n[o],t)}function rr(e,r,t,n,o,i,l){let s,a,c,d,u;if(r==="style")return Xn(e,t,n);if(r==="classList")return Hn(e,t,n);if(t===n)return n;if(r==="ref")i||t(e);else if(r.slice(0,3)==="on:"){const h=r.slice(3);n&&e.removeEventListener(h,n,typeof n!="function"&&n),t&&e.addEventListener(h,t,typeof t!="function"&&t)}else if(r.slice(0,10)==="oncapture:"){const h=r.slice(10);n&&e.removeEventListener(h,n,!0),t&&e.addEventListener(h,t,!0)}else if(r.slice(0,2)==="on"){const h=r.slice(2).toLowerCase(),f=Vn.has(h);if(!f&&n){const m=Array.isArray(n)?n[0]:n;e.removeEventListener(h,m)}(f||t)&&(yt(e,h,t,f),f&&Ke([h]))}else r.slice(0,5)==="attr:"?Ge(e,r.slice(5),t):r.slice(0,5)==="bool:"?Kn(e,r.slice(5),t):(u=r.slice(0,5)==="prop:")||(c=Nn.has(r))||(d=Bn(r,e.tagName))||(a=jn.has(r))||(s=e.nodeName.includes("-")||"is"in l)?(u&&(r=r.slice(5),a=!0),r==="class"||r==="className"?ce(e,t):s&&!a&&!c?e[Zn(r)]=t:(r==="value"||r==="defaultValue")&&(e.nodeName==="INPUT"||e.nodeName==="TEXTAREA")?e[d||r]=t??"":e[d||r]=t):Ge(e,Gn[r]||r,t);return t}function Jn(e){let r=e.target;const t=`$$${e.type}`,n=e.target,o=e.currentTarget,i=a=>Object.defineProperty(e,"target",{configurable:!0,value:a}),l=()=>{const a=r[t];if(a&&!r.disabled){const c=r[`${t}Data`];if(c!==void 0?a.call(r,c,e):a.call(r,e),e.cancelBubble)return}return r.host&&typeof r.host!="string"&&!r.host._$host&&r.contains(e.target)&&i(r.host),!0},s=()=>{for(;l()&&(r=r._$host||r.parentNode||r.host););};Object.defineProperty(e,"currentTarget",{configurable:!0,get(){return r||document}});try{if(e.composedPath){const a=e.composedPath();i(a[0]);for(let c=0;c<a.length-2&&(r=a[c],!!l());c++){if(r._$host){r=r._$host,s();break}if(r.parentNode===o)break}}else s();i(n)}finally{e=r=null}}function nt(e,r,t,n,o){for(;typeof t=="function";)t=t();if(r===t)return t;const i=typeof r,l=n!==void 0;if(e=l&&t[0]&&t[0].parentNode||e,i==="string"||i==="number"){if(i==="number"&&(r=r.toString(),r===t))return t;if(l){let s=t[0];s&&s.nodeType===3?s.data!==r&&(s.data=r):s=document.createTextNode(r),t=$e(e,t,n,s)}else t!==""&&typeof t=="string"?t=e.firstChild.data=r:t=e.textContent=r}else if(r==null||i==="boolean")t=$e(e,t,n);else{if(i==="function")return X(()=>{let s=r();for(;typeof s=="function";)s=s();t=nt(e,s,t,n)}),()=>t;if(Array.isArray(r)){const s=[],a=t&&Array.isArray(t);if(Gt(s,r,t,o))return X(()=>t=nt(e,s,t,n,!0)),()=>t;if(s.length===0){if(t=$e(e,t,n),l)return t}else a?t.length===0?nr(e,s,n):Un(e,t,s):(t&&$e(e),nr(e,s));t=s}else if(r.nodeType){if(Array.isArray(t)){if(l)return t=$e(e,t,n,r);$e(e,t,null,r)}else t==null||t===""||!e.firstChild?e.appendChild(r):e.replaceChild(r,e.firstChild);t=r}}return t}function Gt(e,r,t,n){let o=!1;for(let i=0,l=r.length;i<l;i++){let s=r[i],a=t&&t[e.length],c;if(!(s==null||s===!0||s===!1))if((c=typeof s)=="object"&&s.nodeType)e.push(s);else if(Array.isArray(s))o=Gt(e,s,a)||o;else if(c==="function")if(n){for(;typeof s=="function";)s=s();o=Gt(e,Array.isArray(s)?s:[s],Array.isArray(a)?a:[a])||o}else e.push(s),o=!0;else{const d=String(s);a&&a.nodeType===3&&a.data===d?e.push(a):e.push(document.createTextNode(d))}}return o}function nr(e,r,t=null){for(let n=0,o=r.length;n<o;n++)e.insertBefore(r[n],t)}function $e(e,r,t,n){if(t===void 0)return e.textContent="";const o=n||document.createTextNode("");if(r.length){let i=!1;for(let l=r.length-1;l>=0;l--){const s=r[l];if(o!==s){const a=s.parentNode===e;!i&&!l?a?e.replaceChild(o,s):e.insertBefore(o,t):a&&s.remove()}else i=!0}}else e.insertBefore(o,t);return[o]}const Xe=`/* THE stat color palette for the whole DoozDex site: one color per 10 base-stat
   points. Entry 0 = 0-9, 1 = 10-19, ... 24 = 240-249, 25 = 250 and up.
   Finalized by Dooz 2026-11-16 (40-99 retouched the same day). Only change when Dooz asks;
   there is no in-page color editor any more - edit this array.

   Used by: the boss guide (remix_bossguide.js), the DoozDex sidebar
   (doozdex-sidebar/alia/src/utils/constants.ts reads this file at build time),
   and any future site page that colors stats. Keep the array as plain JSON
   (double quotes, one line) - the sidebar build parses it. */
var REMIX_STAT_COLORS = ["#4f0303","#610505","#880707","#ae0909","#d14800","#e47c00","#f4b82b","#f4e42f","#f9ff00","#d0f300","#95e40c","#5cc70a","#227406","#11a608","#0bd97c","#00ffbe","#0acfb2","#00c7c9","#00b8ff","#00a7ff","#0082ff","#9500f3","#b400f3","#d700f3","#f300ce","#ff00e9"];

/* Color for a base stat value. */
function remixStatColor(v) {
	return REMIX_STAT_COLORS[Math.max(0, Math.min(REMIX_STAT_COLORS.length - 1, Math.floor((v || 0) / 10)))];
}
`,Qn=`/* header */\r
a img {\r
	border: 0;\r
}\r
.header {\r
	margin: 0 0 30px 0;\r
\r
	background: #52236f;\r
	background: -webkit-gradient(\r
		linear,\r
		left top,\r
		left bottom,\r
		from(#6e3398),\r
		to(#3f1a5e)\r
	);\r
	background: -moz-linear-gradient(to bottom, #6e3398, #3f1a5e);\r
	background: linear-gradient(to bottom, #6e3398, #3f1a5e);\r
	filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#E8EEFC', endColorstr='#D7DEEA');\r
\r
	border-bottom: 1px solid #aaa;\r
	box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.6),\r
		0px 2px 2px rgba(0, 0, 0, 0.15);\r
	min-height: 50px;\r
}\r
.header-inner {\r
	max-width: 605px;\r
	margin: 0 auto;\r
}\r
.nav,\r
.nav li,\r
.nav-play,\r
.nav-play li {\r
	display: block;\r
	list-style: none;\r
	margin: 0;\r
	padding: 0;\r
	float: left;\r
}\r
.nav {\r
	padding: 15px 6px 15px 6px;\r
}\r
.header .nav {\r
	padding: 15px 0 15px 155px;\r
}\r
.header .nav-play {\r
	padding: 15px 0 15px 10px;\r
}\r
.nav .button {\r
	position: relative;\r
	padding: 5px 10px;\r
	margin: 0 -1px 0 0;\r
	border-radius: 0;\r
}\r
.nav .button img {\r
	position: absolute;\r
	top: -8px;\r
	left: -150px;\r
}\r
.nav .button.cur,\r
.nav .button.cur:hover {\r
	color: #777777;\r
	background: #f8f8f8;\r
	-webkit-box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);\r
	-moz-box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);\r
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);\r
}\r
.nav .button.cur:hover {\r
	border: solid 1px #888888;\r
}\r
.nav .button:hover {\r
	z-index: 10;\r
}\r
.nav .button.nav-first {\r
	border-top-left-radius: 5px;\r
	border-bottom-left-radius: 5px;\r
}\r
.nav .button.nav-last {\r
	border-top-right-radius: 5px;\r
	border-bottom-right-radius: 5px;\r
}\r
.button {\r
	outline: none;\r
	cursor: pointer;\r
	text-align: center;\r
	text-decoration: none;\r
	text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);\r
	border-radius: 5px;\r
	-webkit-box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2),\r
		inset 0 -1px 2px rgba(255, 255, 255, 1);\r
	-moz-box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2),\r
		inset 0 -1px 2px rgba(255, 255, 255, 1);\r
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2),\r
		inset 0 -1px 2px rgba(255, 255, 255, 1);\r
	white-space: nowrap;\r
\r
	/* default colors */\r
	color: #222222;\r
	border: solid 1px #aaaaaa;\r
	background: #e3e3e3;\r
	background: -webkit-gradient(\r
		linear,\r
		left top,\r
		left bottom,\r
		from(#f6f6f6),\r
		to(#e3e3e3)\r
	);\r
	background: -moz-linear-gradient(top, #f6f6f6, #e3e3e3);\r
	background: linear-gradient(top, #f6f6f6, #e3e3e3);\r
	filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#f6f6f6', endColorstr='#e3e3e3');\r
}\r
.button:hover {\r
	background: #cfcfcf;\r
	background: -webkit-gradient(\r
		linear,\r
		left top,\r
		left bottom,\r
		from(#f2f2f2),\r
		to(#cfcfcf)\r
	);\r
	background: -moz-linear-gradient(top, #f2f2f2, #cfcfcf);\r
	background: linear-gradient(top, #f2f2f2, #cfcfcf);\r
	filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#f2f2f2', endColorstr='#cfcfcf');\r
	border-color: #606060;\r
}\r
.button:active {\r
	background: -webkit-gradient(\r
		linear,\r
		left top,\r
		left bottom,\r
		from(#cfcfcf),\r
		to(#f2f2f2)\r
	);\r
	background: -moz-linear-gradient(top, #cfcfcf, #f2f2f2);\r
	background: linear-gradient(top, #cfcfcf, #f2f2f2);\r
	filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#cfcfcf', endColorstr='#f2f2f2');\r
}\r
\r
.greenbutton {\r
	background: hsl(100, 30%, 93%);\r
	background: -webkit-gradient(\r
		linear,\r
		left top,\r
		left bottom,\r
		from(hsl(100, 30%, 97%)),\r
		to(hsl(100, 30%, 84%))\r
	);\r
	background: -moz-linear-gradient(\r
		top,\r
		hsl(100, 30%, 97%),\r
		hsl(100, 30%, 84%)\r
	);\r
	background: linear-gradient(top, hsl(100, 30%, 97%), hsl(100, 30%, 84%));\r
	border-color: hsl(100, 30%, 70%);\r
	filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#f6f6f6', endColorstr='#e3e3e3');\r
}\r
.greenbutton:hover {\r
	background: hsl(100, 30%, 87%);\r
	background: -webkit-gradient(\r
		linear,\r
		left top,\r
		left bottom,\r
		from(hsl(100, 30%, 94%)),\r
		to(hsl(100, 30%, 77%))\r
	);\r
	background: -moz-linear-gradient(\r
		top,\r
		hsl(100, 30%, 94%),\r
		hsl(100, 30%, 77%)\r
	);\r
	background: linear-gradient(top, hsl(100, 30%, 94%), hsl(100, 30%, 77%));\r
	border-color: hsl(100, 30%, 41%);\r
}\r
.greenbutton:active {\r
	background: hsl(100, 30%, 77%);\r
	background: -webkit-gradient(\r
		linear,\r
		left top,\r
		left bottom,\r
		from(hsl(100, 30%, 77%)),\r
		to(hsl(100, 30%, 83%))\r
	);\r
	background: -moz-linear-gradient(\r
		top,\r
		hsl(100, 30%, 77%),\r
		hsl(100, 30%, 83%)\r
	);\r
	background: linear-gradient(top, hsl(100, 30%, 77%), hsl(100, 30%, 83%));\r
	border-color: hsl(100, 30%, 41%);\r
}\r
\r
/* general page styling */\r
html,\r
body {\r
	font: 10pt Verdana, sans-serif;\r
	background-color: white;\r
	color: black;\r
	margin: 0;\r
	padding: 0;\r
	min-width: 100em;\r
}\r
.wrapper {\r
	padding: 0 1em;\r
	max-width: 1285px;\r
	margin: 0 auto;\r
}\r
.credits {\r
	clear: both;\r
	padding: 20px;\r
	max-width: 1285px;\r
	margin: 0px auto;\r
}\r
div.wrapper > div > span {\r
	padding-right: 5px;\r
}\r
fieldset {\r
	float: left;\r
	background-color: #f1f4f9;\r
	border: 1px solid #aaaaaa;\r
}\r
legend {\r
	font-weight: bold;\r
	text-align: center;\r
}\r
th,\r
td {\r
	padding: 0;\r
}\r
th {\r
	font-size: 0.8em;\r
}\r
.title-text {\r
	font-weight: bold;\r
	font-size: 1.5em;\r
	margin: 0.5em 1em 0.5em 0;\r
	position: relative;\r
	top: -5px;\r
}\r
.main-title-text {\r
	top: -10px;\r
}\r
.big-text {\r
	text-align: left;\r
	font-weight: bold;\r
	font-size: 1.1em;\r
	margin: 0.5em 0;\r
}\r
.big-text #mainResult:hover {\r
	/* indicates the presence of click-to-copy function */\r
	cursor: pointer;\r
	opacity: 0.7;\r
}\r
#tooltipText {\r
	font-size: 0.8em;\r
	visibility: hidden;\r
	border-radius: 5px;\r
	width: 120px;\r
	background-color: black;\r
	color: white;\r
	text-align: center;\r
	padding: 5px;\r
	margin-left: 10px;\r
}\r
.small-text {\r
	font-size: 0.8em;\r
}\r
.panel {\r
	float: left;\r
	display: inline-block; /* required for honkaculate to work */\r
}\r
.poke-info {\r
	width: 30em;\r
}\r
.field-info,\r
.poke-import {\r
	text-align: center;\r
	width: 27.5em;\r
}\r
.holder-0 {\r
	position: absolute;\r
	top: 151px;\r
}\r
#holder-2 tr {\r
	white-space: nowrap;\r
}\r
\r
/* general button styling */\r
.btn {\r
	text-align: center;\r
	border: solid 1px #aaaaaa;\r
	padding: 4px 4px;\r
	position: relative;\r
	cursor: pointer;\r
	color: #555555;\r
	background: #e9e9e9;\r
	margin: -1px -3px 0;\r
	display: inline-block;\r
	width: 5em;\r
	border-radius: 8px;\r
}\r
.btn-wide {\r
	width: 7em;\r
}\r
.btn-xwide {\r
	width: 8em;\r
}\r
.btn-xxwide {\r
	width: 9em;\r
}\r
.btn-xxxwide {\r
	width: 10em;\r
}\r
.btn-small {\r
	width: 4em;\r
}\r
.btn-xsmall {\r
	width: 1em;\r
}\r
.btn-left {\r
	border-top-right-radius: 0;\r
	border-bottom-right-radius: 0;\r
}\r
.btn-right {\r
	border-top-left-radius: 0;\r
	border-bottom-left-radius: 0;\r
}\r
.btn-top {\r
	border-bottom-left-radius: 0;\r
	border-bottom-right-radius: 0;\r
}\r
.btn-bottom {\r
	border-top-left-radius: 0;\r
	border-top-right-radius: 0;\r
}\r
.btn-mid {\r
	border-radius: 0;\r
}\r
.visually-hidden:focus-visible + .btn, /* keyboard focus only: a mouse click no longer leaves the button highlighted */\r
.btn:hover {\r
	z-index: 10;\r
	border-color: #777777;\r
	background: #e3e3e3;\r
}\r
.visually-hidden:checked + .btn {\r
	font-weight: bold;\r
	color: #111111;\r
	background: #f5f5f5;\r
}\r
.visually-hidden[type="radio"]:checked + .btn {\r
	cursor: default;\r
}\r
\r
/* Hide element visually, but not from screen readers. See http://adrianroselli.com/2017/05/under-engineered-custom-radio-buttons-and-checkboxen.html */\r
.visually-hidden {\r
	clip: rect(1px, 1px, 1px, 1px);\r
	height: 1px;\r
	overflow: hidden;\r
	position: absolute;\r
	top: auto;\r
	white-space: nowrap; /* https://medium.com/@jessebeach/beware-smushed-off-screen-accessible-text-5952a4c2cbfe */\r
}\r
\r
.visually-hidden:disabled + .btn {\r
	color: #999999;\r
}\r
.btn-group {\r
	display: inline-block;\r
	width: 100%;\r
}\r
.left {\r
	float: left;\r
}\r
.right {\r
	float: right;\r
}\r
.locked-move:checked + .btn {\r
	background: #ffff99;\r
}\r
\r
.genSelection,\r
.notationSelection,\r
.modeSelection {\r
	display: inline-block;\r
	position: relative;\r
	top: -8px;\r
}\r
\r
/* header */\r
.move-result-group {\r
	min-width: 50em;\r
	margin: 1em 0 11.5em;\r
}\r
.move-result-subgroup {\r
	float: left;\r
	width: 50%;\r
}\r
.move-result-group .btn {\r
	margin-right: 1em;\r
}\r
.main-result-group {\r
	margin: 2em 0 1em;\r
}\r
.result-move-header {\r
	font-size: 0.8em;\r
	font-weight: bold;\r
	margin: 0 0 5px;\r
}\r
\r
/* pokemon info */\r
.poke-info label {\r
	display: inline-block;\r
	width: 6em;\r
}\r
.top label,\r
.info-selectors label {\r
	display: inline-block;\r
	width: 5em;\r
}\r
.poke-info input:not([type]),\r
.poke-info input[type="text"],\r
.poke-info span {\r
	display: inline-block;\r
	width: 2.5em;\r
}\r
.poke-info input[type="number"] {\r
	display: inline-block;\r
	width: 3em;\r
}\r
.info-group {\r
	margin: 1em 0;\r
}\r
.set-selector {\r
	width: 100%;\r
}\r
.info-selectors select {\r
	width: 12em;\r
}\r
select.toxic-counter {\r
	width: 5.5em;\r
}\r
.move-selector,\r
.move-bp,\r
.move-type,\r
.move-cat,\r
.move-hits {\r
	font-size: 0.9em;\r
}\r
.move-selector {\r
	width: 11.5em;\r
}\r
.poke-info input.move-bp {\r
	width: 2em;\r
}\r
.move-type {\r
	width: 5.5em;\r
}\r
.move-cat {\r
	width: 6em;\r
}\r
.move-hits {\r
	width: 4.5em;\r
}\r
.poke-info .crit-btn {\r
	font-size: 0.8em;\r
	width: 2.5em;\r
	height: 1em;\r
	padding: 3px 3px;\r
	margin: 0px 1px;\r
}\r
.poke-info .z-btn {\r
	font-size: 0.8em;\r
	width: 1.5em;\r
	height: 1em;\r
	padding: 3px 3px;\r
}\r
.poke-info .max-btn {\r
	font-size: 0.8em;\r
	width: 2.5em;\r
	height: 1em;\r
	padding: 3px 3px;\r
}\r
\r
/* field info */\r
.field-info .btn {\r
	font-size: 0.8em;\r
}\r
table.field {\r
	width: 100%;\r
}\r
\r
[hidden],\r
.hide {\r
	display: none;\r
}\r
\r
/* select2 overrides */\r
.select2-container .select2-choice > .select2-chosen {\r
	width: 100%;\r
}\r
.small-select.select2-container .select2-choice {\r
	font-size: 0.9em;\r
	height: 18px;\r
	line-height: 18px;\r
}\r
.small-select.select2-container .select2-choice .select2-arrow b {\r
	background-position: 0 -4px;\r
}\r
.small-select.select2-dropdown-open .select2-choice .select2-arrow b {\r
	background-position: -18px -4px;\r
}\r
\r
/* Bootstrap */\r
.panel-group > .panel {\r
	clear: left;\r
}\r
\r
/* ColVis */\r
.clear {\r
	clear: right;\r
}\r
\r
.import-team-text {\r
	min-width: 27em;\r
	min-height: 10em;\r
	resize: vertical;\r
}\r
\r
.import-name-text {\r
	min-width: 26.3em;\r
	min-height: 1em;\r
	overflow: auto;\r
	display: inline;\r
}\r
\r
.hpbar {\r
	height: 4px;\r
	border-style: solid;\r
	border-top-width: 2px;\r
	border-right-width: 1px;\r
	border-bottom-width: 2px;\r
	border-left-width: 0.5px;\r
	border-radius: 3px;\r
}\r
\r
.hpbar.hp-green {\r
	border-top-color: #00dd60;\r
	background-color: green;\r
	border-bottom-color: #007734;\r
	border-right-color: #007734;\r
}\r
\r
.hpbar.hp-yellow {\r
	border-top-color: #f8e379;\r
	background-color: #f5d538;\r
	border-bottom-color: #be9f0a;\r
	border-right-color: #be9f0a;\r
}\r
\r
.hpbar.hp-red {\r
	border-top-color: #f37f67;\r
	background-color: #ee4928;\r
	border-bottom-color: #a3260d;\r
	border-right-color: #a3260d;\r
}\r
\r
.pool {\r
	padding: 15px 0;\r
}\r
.ability-pool,\r
.move-pool {\r
	padding-bottom: 5px;\r
}\r
.extraSetAbilities,\r
.extraSetItems,\r
.extraSetMoves {\r
	width: 100%;\r
}\r
.trainer-poks {\r
	margin-bottom: 20px;\r
}\r
\r
.trainer-pok-list {\r
	display: flex;\r
	flex-wrap: wrap;\r
	width: 300px;\r
	margin-top: 20px;\r
}\r
\r
.player-poks {\r
	height: auto;\r
	min-width: 100%;\r
	overflow: scroll;\r
	min-height: 96px;\r
	max-height: 595px;\r
	display: flex;\r
	justify-content: flex-start;\r
}\r
\r
.player-party {\r
	background-size: 100% 595px;\r
	background-repeat: no-repeat;\r
	height: auto;\r
	width: 300px;\r
	min-width: 100%;\r
	overflow: scroll;\r
	min-height: 96px;\r
	justify-content: space-between;\r
	display: none;\r
	justify-content: flex-start;\r
}\r
\r
.player-party .trainer-pok-container {\r
	width: calc(16.66% - 3px);\r
	margin: 0;\r
	padding: 0;\r
}\r
\r
.player-party .trainer-pok.left-side {\r
	background-size: cover;\r
	height: 100%;\r
	width: 100%;\r
}\r
\r
.trainer-pok {\r
	height: auto;\r
	width: calc(33% - 10px);\r
	cursor: pointer;\r
	box-sizing: border-box;\r
	border: 1px solid #282a36;\r
	border-radius: 10px;\r
	margin: 5px;\r
	background-position-x: -20px;\r
	background-position-y: -20px;\r
}\r
\r
.trainer-pok {\r
	background: none;\r
	border: 1px solid rgb(0, 0, 0, 0);\r
}\r
\r
.trainer-pok.right-side {\r
	width: calc(33% - 10px);\r
}\r
\r
.trainer-pok:hover {\r
	border: 1px solid #f18906;\r
	border-radius: 10px;\r
}\r
\r
.trainer-pok-container {\r
	display: flex;\r
	flex-direction: column;\r
	margin-left: 10px;\r
	align-items: center;\r
	border: 1px solid #282a36;\r
	padding: 5px;\r
	width: calc(20% - 22px);\r
}\r
\r
.trainer-pok-container:hover {\r
	border: 1px solid #1abc9c;\r
	border-radius: 10px;\r
}\r
\r
.player-party .trainer-pok-container:hover {\r
	border: none;\r
}\r
\r
.pranks-buttons {\r
  border-radius: 5px;\r
  margin: 2px;\r
}\r
\r
#clearThisSet {\r
  color: #d00000;\r
  border: 1px solid #c00000;\r
}\r
\r
#clearSets {\r
  color: #b00000;\r
  border: 2px solid #a00000;\r
}\r
/* ===== Remix dark mode (body.dark; toggled by #theme-toggle) ===== */\r
body.dark { background-color: #17141c; color: #fff; }\r
body.dark a { color: #c9a6ef; }\r
body.dark a:visited { color: #b48be0; }\r
body.dark hr { border-color: #3a3344; }\r
body.dark fieldset { background-color: #221d2a; border-color: #3a3344; }\r
body.dark legend { color: #fff; }\r
body.dark .credits { color: #a59cb0; }\r
body.dark .small-text, body.dark .result-move-header, body.dark .poke-info label, body.dark .info-selectors label { color: #fff; }\r
\r
body.dark input, body.dark select, body.dark textarea, body.dark input[type="number"], body.dark input[type="text"] {\r
	background-color: #2b2533; color: #fff; border: 1px solid #4a4256;\r
}\r
body.dark input:disabled, body.dark select:disabled { background-color: #221d2a; color: #8a8294; }\r
\r
body.dark .btn { color: #fff; background: #2e2837; border-color: #4a4256; }\r
body.dark .btn:hover { color: #fff; background: #3a3246; border-color: #6e5a88; }\r
body.dark .visually-hidden:checked + .btn { color: #fff; background: #5b2f82; border-color: #8a5ab8; }\r
body.dark .visually-hidden:disabled + .btn { color: #6e667a; }\r
body.dark .locked-move:checked + .btn { background: #6b5a1e; color: #fff4c2; }\r
\r
body.dark .button { color: #fff; background: #2e2837; border-color: #4a4256; }\r
body.dark .button:hover { background: #3a3246; border-color: #6e5a88; }\r
\r
body.dark #tooltipText { background-color: #000; color: #fff; }\r
\r
/* select2 dropdowns (searchable pickers) */\r
body.dark .select2-container .select2-choice, body.dark .select2-container-multi .select2-choices {\r
	background: #2b2533 !important; color: #fff !important; border-color: #4a4256 !important;\r
}\r
body.dark .select2-container .select2-choice .select2-arrow { background: #2b2533 !important; border-left-color: #4a4256 !important; }\r
body.dark .select2-drop, body.dark .select2-drop.select2-drop-above { background: #2b2533; color: #fff; border-color: #6e5a88; }\r
body.dark .select2-search input { background-color: #1f1a26 !important; color: #fff; border-color: #4a4256; }\r
/* select2 paints a white gradient over the box: keep only its search icon on the dark background */\r
body.dark .select2-search input, body.dark .select2-search input.select2-active {\r
	background: #1f1a26 url("../js/vendor/select2/select2.png") no-repeat 100% -22px !important;\r
}\r
body.dark .select2-search input.select2-active { background-image: url("../js/vendor/select2/select2-spinner.gif") !important; background-position: 100% center !important; }\r
body.dark .select2-results .select2-highlighted { background: #5b2f82; color: #fff; }\r
body.dark .select2-results .select2-result-label { color: inherit; }\r
body.dark .select2-results li.select2-result-with-children > .select2-result-label { color: #c9a6ef; }\r
body.dark .select2-results .select2-no-results, body.dark .select2-results .select2-searching { background: #221d2a; color: #a59cb0; }\r
\r
body.dark .button { text-shadow: none; box-shadow: 0 1px 2px rgba(0,0,0,0.4); background: #2e2837; }\r
body.dark .nav .button:hover { background: #3a3246; }\r
.header-inner { max-width: 900px; }\r
#theme-toggle { white-space: nowrap; vertical-align: middle; min-width: 140px; padding: 4px 14px; }\r
\r
/* Remix field layout */\r
.btn-tl { border-radius: 8px 0 0 0; }\r
.btn-tr { border-radius: 0 8px 0 0; }\r
.btn-bl { border-radius: 0 0 0 8px; }\r
.btn-br { border-radius: 0 0 8px 0; }\r
.btn-third { width: 6.6em; }\r
.btn-spikes { width: 4.6em; }\r
.btn-third { width: 7em; white-space: nowrap; }\r
.field-info, .poke-import { width: 18.5em; }\r
.field-info, .poke-import { width: 20em; }\r
.import-team-text { min-width: 0; width: 100%; box-sizing: border-box; }\r
.import-name-text { min-width: 0; width: 100%; box-sizing: border-box; }\r
.remix-mini { width: 68px; height: 56px; margin: -6px 10px -40px 0; image-rendering: pixelated; }\r
.remix-mini { float: none; vertical-align: top; margin: -10px 0 -46px 4px; }\r
.remix-mini { width: 80px; height: 60px; margin: -12px 0 -48px 4px; image-rendering: pixelated; }\r
/* Pokemon 1 faces right, toward Pokemon 2 */\r
#p1 .remix-mini { transform: scaleX(-1); }\r
/* Faint white glow around minisprites (remove this rule to revert) */\r
.remix-mini { filter: drop-shadow(0 0 1px rgba(255,255,255,0.55)) drop-shadow(0 0 2px rgba(255,255,255,0.25)); }\r
/* Header logos: zero-width slots on either side of the links */\r
.header .nav { padding-left: 0; }\r
.header-inner { display: flex; justify-content: center; }\r
.header-logo { position: relative; width: 0; height: 24px; }\r
.header-logo img { position: absolute; }\r
\r
/* Team box zoom */\r
.team-zoom { margin: 10px 0 0 10px; font-size: 0.9em; }\r
.team-zoom span { margin-right: 6px; }\r
.team-zoom .btn { width: 2em; padding: 0; margin-right: 2px; }\r
.player-poks .team-slot { position: relative; width: calc(100% / var(--per-row, 3) - 10px); margin: 5px; }\r
.player-poks .team-slot .trainer-pok { width: 100% !important; margin: 0; image-rendering: pixelated; }\r
.player-poks .team-remove { display: none; position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; padding: 0;\r
	border: none; border-radius: 50%; background: #c0392b; color: #fff; font-weight: bold; line-height: 18px; cursor: pointer; }\r
.player-poks .team-slot:hover .team-remove { display: block; }\r
\r
/* Type pills (colors from the Remix type reference) */\r
select.type-pill { border-radius: 10px; color: #fff; font-weight: bold; text-shadow: 0 1px 1px rgba(0,0,0,0.7); text-align-last: center; border: 1px solid rgba(0,0,0,0.6); }\r
select.type-pill.type-Bug { background: linear-gradient(to bottom, #cdd988, #b7c955); }\r
select.type-pill option[value="Bug"] { background: #b7c955; color: #fff; }\r
select.type-pill.type-Dark { background: linear-gradient(to bottom, #bfb1b1, #a39090); }\r
select.type-pill option[value="Dark"] { background: #a39090; color: #fff; }\r
select.type-pill.type-Dragon { background: linear-gradient(to bottom, #9091ff, #6062ff); }\r
select.type-pill option[value="Dragon"] { background: #6062ff; color: #fff; }\r
select.type-pill.type-Electric { background: linear-gradient(to bottom, #ffdb5c, #ffcc16); }\r
select.type-pill option[value="Electric"] { background: #ffcc16; color: #fff; }\r
select.type-pill.type-Fairy { background: linear-gradient(to bottom, #fcd2f2, #fbbeec); }\r
select.type-pill option[value="Fairy"] { background: #fbbeec; color: #fff; }\r
select.type-pill.type-Fighting { background: linear-gradient(to bottom, #df917f, #d16248); }\r
select.type-pill option[value="Fighting"] { background: #d16248; color: #fff; }\r
select.type-pill.type-Fire { background: linear-gradient(to bottom, #f8b24c, #f59100); }\r
select.type-pill option[value="Fire"] { background: #f59100; color: #fff; }\r
select.type-pill.type-Flying { background: linear-gradient(to bottom, #b6cbff, #96b5ff); }\r
select.type-pill option[value="Flying"] { background: #96b5ff; color: #fff; }\r
select.type-pill.type-Ghost { background: linear-gradient(to bottom, #cdb3ee, #b893e6); }\r
select.type-pill option[value="Ghost"] { background: #b893e6; color: #fff; }\r
select.type-pill.type-Grass { background: linear-gradient(to bottom, #a4d68e, #7dc45d); }\r
select.type-pill option[value="Grass"] { background: #7dc45d; color: #fff; }\r
select.type-pill.type-Ground { background: linear-gradient(to bottom, #e9b760, #df981c); }\r
select.type-pill option[value="Ground"] { background: #df981c; color: #fff; }\r
select.type-pill.type-Ice { background: linear-gradient(to bottom, #c8f9ff, #b1f7ff); }\r
select.type-pill option[value="Ice"] { background: #b1f7ff; color: #fff; }\r
select.type-pill.type-Normal { background: linear-gradient(to bottom, #d8d9d2, #c7c9be); }\r
select.type-pill option[value="Normal"] { background: #c7c9be; color: #fff; }\r
select.type-pill.type-Poison { background: linear-gradient(to bottom, #d486b1, #c25290); }\r
select.type-pill option[value="Poison"] { background: #c25290; color: #fff; }\r
select.type-pill.type-Psychic { background: linear-gradient(to bottom, #f4a3e2, #f07cd6); }\r
select.type-pill option[value="Psychic"] { background: #f07cd6; color: #fff; }\r
select.type-pill.type-Rock { background: linear-gradient(to bottom, #ddcfa7, #cfbb81); }\r
select.type-pill option[value="Rock"] { background: #cfbb81; color: #fff; }\r
select.type-pill.type-Steel { background: linear-gradient(to bottom, #a1aeb4, #798b94); }\r
select.type-pill option[value="Steel"] { background: #798b94; color: #fff; }\r
select.type-pill.type-Water { background: linear-gradient(to bottom, #99d1f6, #6dbdf2); }\r
select.type-pill option[value="Water"] { background: #6dbdf2; color: #fff; }\r
select.type-pill option { font-weight: bold; }\r
.poke-info .team-zoom span { display: inline; width: auto; float: none; }\r
.player-poks { overflow: auto; }\r
body.dark .player-poks { scrollbar-color: #4a4256 #221d2a; }\r
/* Breathing room between the Type pills and the Forme row */\r
.poke-info select.type1, .poke-info select.type2 { margin-bottom: 4px; }\r
img.trainer-pok { image-rendering: pixelated; }\r
/* Pokemon 2's trainer preview uses the same grid as Pokemon 1's box */\r
#p2 .trainer-poks { display: flex; flex-wrap: wrap; align-content: flex-start; width: 100%; min-height: 96px; }\r
#p2 .trainer-poks .trainer-pok { width: calc(100% / 3 - 10px); margin: 5px; }\r
/* Pokemon 1's team faces right, toward Pokemon 2 */\r
#p1 .player-poks img.trainer-pok { transform: scaleX(-1); }\r
.imported-sets-row { display: flex !important; align-items: center; gap: 4px; }\r
.imported-sets-row .pranks-buttons { margin: 0; }\r
/* Type pills: pure white text (the dark theme's grey text was winning) */\r
select.type-pill, body.dark select.type-pill { color: #fff; text-shadow: 0 0 2px rgba(0,0,0,0.9), 0 1px 1px rgba(0,0,0,0.9); }\r
.imported-sets-row, .imported-sets-row * { white-space: nowrap; }\r
.imported-sets-row .pranks-buttons { font-size: 0.8em; padding: 1px 6px; line-height: 1.3; }\r
/* Same spacing under the moves on both sides */\r
#p1 .player-poks { margin-top: 0; }\r
/* Active Pokemon sprite: right of the Forme box, same size as the team previews */\r
.poke-info .info-group.top { position: relative; }\r
.poke-info .remix-mini { position: absolute; left: 216px; top: 16px; width: 100px; height: 75px; margin: 0; pointer-events: none; }\r
/* Team boxes: compact; JS gives both the same height (see remix_layout.js) */\r
#p1 .player-poks, #p2 .trainer-poks { min-height: 0; max-height: none; overflow: visible; }\r
/* Scroll only when the sprites don't fit (remix_layout.js adds .remix-scroll); scrollbar sits at the panel edge */\r
#p1 .player-poks.remix-scroll, #p2 .trainer-poks.remix-scroll { max-height: 206px; overflow-y: auto; overflow-x: hidden;\r
	box-sizing: border-box; width: calc(100% + 24px); padding-right: 24px; margin-right: -24px; }\r
body.dark #p2 .trainer-poks { scrollbar-color: #4a4256 #221d2a; }\r
\r
/* Display option buttons next to the title */\r
.ui-toggles { display: inline-flex; gap: 6px; margin-left: 8px; vertical-align: middle; }\r
.ui-toggles .btn { min-width: 140px; white-space: nowrap; padding: 4px 14px; }\r
\r
/* Top move-result buttons in their move type color */\r
.btn.result-typed, body.dark .btn.result-typed { color: #fff; text-shadow: 0 0 2px rgba(0,0,0,0.9), 0 1px 1px rgba(0,0,0,0.9); border-color: rgba(0,0,0,0.55); }\r
.btn.result-typed:hover, body.dark .btn.result-typed:hover { color: #fff; filter: brightness(1.12); }\r
.visually-hidden:checked + .btn.result-typed, body.dark .visually-hidden:checked + .btn.result-typed { font-weight: bold; box-shadow: inset 0 0 0 2px #fff; }\r
.btn.result-typed.type-Bug, body.dark .btn.result-typed.type-Bug { background: linear-gradient(to bottom, #cdd988, #b7c955); }\r
.btn.result-typed.type-Dark, body.dark .btn.result-typed.type-Dark { background: linear-gradient(to bottom, #bfb1b1, #a39090); }\r
.btn.result-typed.type-Dragon, body.dark .btn.result-typed.type-Dragon { background: linear-gradient(to bottom, #9091ff, #6062ff); }\r
.btn.result-typed.type-Electric, body.dark .btn.result-typed.type-Electric { background: linear-gradient(to bottom, #ffdb5c, #ffcc16); }\r
.btn.result-typed.type-Fairy, body.dark .btn.result-typed.type-Fairy { background: linear-gradient(to bottom, #fcd2f2, #fbbeec); }\r
.btn.result-typed.type-Fighting, body.dark .btn.result-typed.type-Fighting { background: linear-gradient(to bottom, #df917f, #d16248); }\r
.btn.result-typed.type-Fire, body.dark .btn.result-typed.type-Fire { background: linear-gradient(to bottom, #f8b24c, #f59100); }\r
.btn.result-typed.type-Flying, body.dark .btn.result-typed.type-Flying { background: linear-gradient(to bottom, #b6cbff, #96b5ff); }\r
.btn.result-typed.type-Ghost, body.dark .btn.result-typed.type-Ghost { background: linear-gradient(to bottom, #cdb3ee, #b893e6); }\r
.btn.result-typed.type-Grass, body.dark .btn.result-typed.type-Grass { background: linear-gradient(to bottom, #a4d68e, #7dc45d); }\r
.btn.result-typed.type-Ground, body.dark .btn.result-typed.type-Ground { background: linear-gradient(to bottom, #e9b760, #df981c); }\r
.btn.result-typed.type-Ice, body.dark .btn.result-typed.type-Ice { background: linear-gradient(to bottom, #c8f9ff, #b1f7ff); }\r
.btn.result-typed.type-Normal, body.dark .btn.result-typed.type-Normal { background: linear-gradient(to bottom, #d8d9d2, #c7c9be); }\r
.btn.result-typed.type-Poison, body.dark .btn.result-typed.type-Poison { background: linear-gradient(to bottom, #d486b1, #c25290); }\r
.btn.result-typed.type-Psychic, body.dark .btn.result-typed.type-Psychic { background: linear-gradient(to bottom, #f4a3e2, #f07cd6); }\r
.btn.result-typed.type-Rock, body.dark .btn.result-typed.type-Rock { background: linear-gradient(to bottom, #ddcfa7, #cfbb81); }\r
.btn.result-typed.type-Steel, body.dark .btn.result-typed.type-Steel { background: linear-gradient(to bottom, #a1aeb4, #798b94); }\r
.btn.result-typed.type-Water, body.dark .btn.result-typed.type-Water { background: linear-gradient(to bottom, #99d1f6, #6dbdf2); }\r
/* Title row settings: labeled damage display + display toggles, one line */\r
.settings-row { display: inline-flex; align-items: flex-end; gap: 18px; vertical-align: middle; position: relative; top: -8px; }\r
.setting-group { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; }\r
.setting-label { font-size: 0.75em; font-weight: bold; opacity: 0.85; width: auto !important; }\r
.settings-row .notationSelection { top: 0; display: inline-flex; }\r
.settings-row .notationSelection .btn { width: auto; padding: 3px 12px; }\r
.ui-toggles { display: inline-flex; gap: 12px; margin-left: 0; }\r
.ui-toggles .btn, #theme-toggle { min-width: 0; width: auto; padding: 3px 12px; margin: 0; }\r
/* Delete buttons: a hair of space below the search bar */\r
.imported-sets-row { position: relative; top: 3px; }\r
/* Move-type pills a little wider so "Fighting" fits */\r
.poke-info select.move-type { width: 6.4em; }\r
/* Remix: no gender mechanics, so the Gender row is hidden; Nature sits in its place */\r
.poke-info .gender-row { display: none !important; }\r
.poke-info .nature-row select.nature { width: 142px; }\r
/* Import / Export buttons row */\r
.import-export-row { display: flex; gap: 6px; justify-content: center; align-items: stretch; margin-top: 6px; }\r
.import-export-row button { border-radius: 6px; padding: 3px 8px; line-height: 1.2; font-weight: bold; color: #2b2533; cursor: pointer; }\r
.import-export-row .export-btn { background: #f7f0bf; border: 1px solid #c9b960; }\r
.import-export-row .import-btn { flex: 1; background: #cdeec6; border: 1px solid #7fb675; }\r
.import-export-row .export-btn:hover { background: #fbf5d2; }\r
.import-export-row .export-all-btn { background: #f8d9a8; border: 1px solid #d39a4a; }\r
.import-export-row .export-all-btn:hover { background: #fbe6c4; }\r
.import-export-row .import-btn:hover { background: #ddf5d7; }\r
/* Drag-to-reorder for Pokemon 1's team */\r
.player-poks .team-slot { cursor: grab; }\r
.player-poks .team-slot.dragging { opacity: 0.4; }\r
.player-poks .team-slot.drop-target { outline: 2px dashed #c9a6ef; outline-offset: -2px; border-radius: 10px; }\r
/* Type defense chart placeholder (right column of each Pokemon panel) */\r
fieldset.poke-info { position: relative; }\r
.type-chart { position: absolute; top: 78px; right: 8px; width: 104px; }\r
.tc-title { font-size: 0.75em; font-weight: bold; text-align: center; margin-bottom: 3px; opacity: 0.85; }\r
.tc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 6px; }\r
.tc-cell { display: flex; flex-direction: column; align-items: stretch; border-radius: 5px; overflow: hidden; border: 1px solid rgba(0,0,0,0.5); }\r
.tc-tile { color: #fff; font-weight: bold; font-size: 0.75em; text-align: center; padding: 2px 0; text-shadow: 0 0 2px rgba(0,0,0,0.9), 0 1px 1px rgba(0,0,0,0.9); }\r
.tc-val { font-size: 0.75em; text-align: center; padding: 1px 0; background: rgba(255,255,255,0.08); min-height: 14px; }\r
body:not(.dark) .tc-val { background: rgba(0,0,0,0.06); }\r
.poke-info .type-chart span { display: block; width: auto; }\r
.tc-grid { gap: 2px 4px; }\r
.tc-tile { padding: 1px 0; }\r
.tc-val { min-height: 13px; line-height: 13px; }\r
/* A little extra width so larger sprites don't crowd the type chart */\r
fieldset.poke-info { padding-right: 30px; }\r
/* Header link text in the Dooz logo's Master Ball pink */\r
.header .nav .button, body.dark .header .nav .button { color: #ef1c7b; font-weight: bold; }\r
/* Harsh weather row: three cells, text fills most of each */\r
.field-info .btn-third { padding-left: 0; padding-right: 0; }\r
.field-info .veil-btn { white-space: nowrap; font-size: 0.8em; width: 114px; padding-left: 0; padding-right: 0; }\r
/* Slight color tint on weather + terrain text (unselected) */\r
body.dark .visually-hidden:not(:checked) + label[for=sun] { color: #ffcf8f; }\r
body.dark .visually-hidden:not(:checked) + label[for=rain] { color: #9fcbff; }\r
body.dark .visually-hidden:not(:checked) + label[for=sand] { color: #e6d3a3; }\r
body.dark .visually-hidden:not(:checked) + label[for=hail] { color: #c3efff; }\r
body.dark .visually-hidden:not(:checked) + label[for=harsh-sunshine] { color: #ffab85; }\r
body.dark .visually-hidden:not(:checked) + label[for=heavy-rain] { color: #82b4ff; }\r
body.dark .visually-hidden:not(:checked) + label[for=electric] { color: #f6e27e; }\r
body.dark .visually-hidden:not(:checked) + label[for=grassy] { color: #a8e597; }\r
body.dark .visually-hidden:not(:checked) + label[for=misty] { color: #f4b6e9; }\r
body.dark .visually-hidden:not(:checked) + label[for=psychic] { color: #ee9cc4; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=sun] { color: #b86a00; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=rain] { color: #1f63b5; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=sand] { color: #8c6d2e; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=hail] { color: #2b8fb0; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=harsh-sunshine] { color: #c2410c; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=heavy-rain] { color: #1e40af; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=electric] { color: #a07800; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=grassy] { color: #3d7f22; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=misty] { color: #b0479c; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=psychic] { color: #b8326f; }\r
.field .battery-row { display: none !important; }\r
.field-info .btn-third { width: 7.94em; white-space: nowrap; }\r
body.dark .visually-hidden:not(:checked) + label[for=strong-winds] { color: #aab9f3; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=strong-winds] { color: #4256b8; }\r
.field .foresight-row { display: none !important; }\r
/* Type box changed from the Pokemon's normal type: red dashed outline + italic */\r
.poke-info select.type-changed { font-style: italic; outline: 2px dashed #ff4d4d; outline-offset: 1px; }\r
.poke-info select.type-changed:not(.type-pill) { color: #ff6b6b; }\r
/* Field side cells (Reflect ... Switching Out): all the same width as the Spikes group */\r
table.field .btn:not([for^="spikes"]):not([for^="gscSpikes"]) { width: 114px; box-sizing: content-box; padding-left: 0; padding-right: 0; white-space: nowrap; }\r
/* Weather row: 4 buttons (None hidden; click an active weather again to clear it) */\r
.field-info .btn-weather { width: calc(5em + 2px); }\r
/* Mudslide | Gravity | Magic Room | Wonder Room in one row */\r
.field-info .rooms-row .btn-quarter { width: 63px; padding-left: 0; padding-right: 0; font-size: 0.72em; white-space: nowrap; }\r
/* Side cells ~10% wider, with a thin divider down the middle */\r
table.field .btn:not([for^="spikes"]):not([for^="gscSpikes"]) { width: 126px; }\r
.field-info .btn-spikes { width: calc(4.6em + 10px); }\r
table.field td:first-child { border-right: 1px solid rgba(160, 140, 190, 0.35); }\r
body.dark .visually-hidden:not(:checked) + label[for=mudslide] { color: #d9b48a; }\r
body:not(.dark) .visually-hidden:not(:checked) + label[for=mudslide] { color: #8a5a2b; }\r
.field-info .rooms-row .btn-quarter { font-size: 0.7em; letter-spacing: -0.3px; }\r
.field-info .rooms-row label[for=mudslide], .field-info .rooms-row label[for=gravity] { font-size: 0.8em; letter-spacing: normal; }\r
.field-info .rooms-row .btn-quarter { box-sizing: border-box; width: 64px; min-width: 64px; max-width: 64px; }\r
.import-export-row button { white-space: nowrap; font-size: 0.78em; padding: 4px 6px; }\r
.import-export-row .import-btn { font-size: 0.95em; }\r
.import-export-row .export-btn, .import-export-row .export-all-btn { font-size: 0.9em; }\r
.poke-info .status-row { margin-top: 3px; }\r
/* Bigger gap between Item and Current HP; Health bar pulled up under Status */\r
.poke-info .hp-group { padding-top: 10px; }\r
.poke-info .health-label { margin-top: 8px; }\r
\r
/* ---- Remix: apply damage / heal ---- */\r
.remix-apply { border: 1px solid #b9b0c6; background: #f4f0f8; color: #5b4a73; border-radius: 5px; padding: 0 7px; margin-left: 6px; font-size: 11px; font-weight: bold; line-height: 16px; white-space: nowrap; cursor: pointer; transition: background .15s, transform .15s; vertical-align: middle; }\r
.remix-apply:hover, .remix-apply.active { background: #e4d9f2; transform: scale(1.04); }\r
.remix-heal { border: 1px solid #9cc7a4; background: #eef8f0; color: #2f7a3d; border-radius: 6px; padding: 0 7px; margin-left: 6px; font-size: 11px; line-height: 18px; cursor: pointer; transition: background .15s, transform .15s; }\r
.remix-heal:hover { background: #d9f0de; transform: scale(1.06); }\r
.remix-dmg-picker { position: absolute; z-index: 1000; min-width: 230px; max-width: 340px; background: #fff; color: #2a2433; border: 1px solid #c9c0d6; border-radius: 10px; padding: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.18); opacity: 0; transform: translateY(-6px) scale(.98); transition: opacity .15s ease, transform .15s ease; font-size: 12px; }\r
.remix-dmg-picker.open { opacity: 1; transform: none; }\r
.rdp-title { font-weight: bold; margin-bottom: 8px; }\r
.rdp-label { margin: 8px 0 4px; opacity: .7; }\r
.rdp-row { display: flex; flex-wrap: wrap; gap: 5px; }\r
.rdp-btn { border: 1px solid #c9c0d6; background: #f6f3fa; color: inherit; border-radius: 6px; padding: 3px 8px; cursor: pointer; transition: background .12s, transform .12s; }\r
.rdp-btn:hover { background: #e7dcf4; transform: translateY(-1px); }\r
.rdp-main { flex: 1; display: flex; flex-direction: column; align-items: center; font-weight: bold; }\r
.rdp-main small { font-weight: normal; opacity: .75; }\r
.rdp-roll { min-width: 34px; padding: 2px 4px; }\r
.rdp-custom { margin-top: 8px; }\r
.rdp-custom input { flex: 1; min-width: 0; border: 1px solid #c9c0d6; border-radius: 6px; padding: 3px 6px; background: #fff; color: inherit; }\r
.remix-hp-float { position: absolute; right: 4px; top: 0; font-weight: bold; pointer-events: none; transition: transform 1s ease-out, opacity 1s ease-out; }\r
.remix-hp-float.hurt { color: #d23c3c; }\r
.remix-hp-float.heal { color: #2f9a45; }\r
.remix-hp-float.go { transform: translateY(-22px); opacity: 0; }\r
.hpbar { transition: background .4s ease; }\r
body.dark .remix-apply { background: #2b2435; border-color: #4a4058; color: #fff; }\r
body.dark .remix-apply:hover, body.dark .remix-apply.active { background: #3a3048; }\r
body.dark .remix-heal { background: #1f3326; border-color: #3d6b4a; color: #9fe0ad; }\r
body.dark .remix-heal:hover { background: #29452f; }\r
body.dark .remix-dmg-picker { background: #241e2d; color: #fff; border-color: #4a4058; box-shadow: 0 8px 24px rgba(0,0,0,.5); }\r
body.dark .rdp-btn, body.dark .rdp-custom input { background: #2e2739; border-color: #4a4058; }\r
body.dark .rdp-btn:hover { background: #3c3249; }\r
\r
/* ---- Remix: enemy team box = same look as the player's box, mirrored; x greys a Pokemon out ---- */\r
#p2 .trainer-poks .enemy-slot { position: relative; display: inline-block; width: calc(100% / var(--per-row, 3) - 10px); margin: 5px; }\r
#p2 .trainer-poks .enemy-slot .trainer-pok { width: 100% !important; margin: 0; image-rendering: pixelated;\r
	transition: filter .25s ease, opacity .25s ease; }\r
#p2 .trainer-poks .enemy-slot.fainted .trainer-pok { filter: grayscale(1); opacity: 0.35; }\r
#p2 .enemy-faint { display: none; position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; padding: 0; border: none; border-radius: 50%;\r
	background: #c0392b; color: #fff; font-weight: bold; line-height: 18px; cursor: pointer; z-index: 2; }\r
#p2 .enemy-slot:hover .enemy-faint { display: block; }\r
#p2 .enemy-slot.fainted .enemy-faint { display: block; background: #6b6377; }\r
\r
/* ---- Remix: remembered HP ---- */\r
.percent-hp { transition: background-color .3s ease; border-radius: 4px; }\r
.poke-info .remix-mini-hp { position: absolute; display: block; width: auto; left: 12%; right: 12%; bottom: 3px; height: 5px; border-radius: 3px; background: rgba(0,0,0,.45); overflow: hidden; pointer-events: auto; }\r
.poke-info .remix-mini-hp i { display: block; height: 100%; border-radius: 3px; transition: width .3s ease; }\r
\r
/* ---- Remix: status emoji/tint, item on/off, team-box markers ---- */\r
.poke-info .remix-status-emoji { display: inline-block; width: 1.6em; text-align: center; margin-left: 2px; }\r
.poke-info .status { transition: background-color .25s ease; }\r
.poke-info .remix-item-on { margin: 0 0 0 4px; vertical-align: middle; cursor: pointer; }\r
.poke-info .item.remix-item-off { opacity: .45; text-decoration: line-through; }\r
.poke-info .remix-mini-status { position: absolute; display: block; width: auto; left: 3px; top: 1px; font-size: 13px; line-height: 1; pointer-events: auto; text-shadow: 0 0 2px rgba(0,0,0,.6); }\r
.poke-info .remix-mini-item { position: absolute; display: block; width: 48px; height: 48px; right: -14px; bottom: -6px; margin: 0; image-rendering: pixelated; pointer-events: auto; filter: drop-shadow(0 0 1px rgba(0,0,0,.6)); }\r
.poke-info .remix-mini-item.off { opacity: .35; filter: grayscale(1); }\r
/* Big held-item icon right of the Ability / Item boxes (left set in remix_minisprite.js) */\r
.poke-info .info-selectors { position: relative; }\r
.poke-info .remix-item-big { position: absolute; top: 50%; width: 64px; height: 64px; margin-top: -32px; image-rendering: pixelated; pointer-events: auto; visibility: hidden; filter: drop-shadow(0 0 2px rgba(0,0,0,.5)); }\r
.poke-info .remix-item-big.off { opacity: .35; filter: grayscale(1); }\r
\r
/* ---- Remix: tick boxes before the boxes, status tint on the closed box only, effective stats ---- */\r
.poke-info .remix-ability-on { margin: 0 4px 0 0; vertical-align: middle; cursor: pointer; }\r
.poke-info .remix-item-on { margin: 0 4px 0 0; }\r
.poke-info .status option { background-color: #fff; color: #222; }\r
body.dark .poke-info .status option { background-color: #2b2533; color: #fff; }\r
.poke-info .totalMod.remix-stat-up { font-weight: bold; background: rgba(60, 180, 90, 0.18); border-radius: 4px; padding: 0 3px; }\r
.poke-info .totalMod.remix-stat-down { font-weight: bold; background: rgba(220, 70, 60, 0.18); border-radius: 4px; padding: 0 3px; }\r
\r
/* ---- Remix: Spikes group (1 | 2 | 3 Spikes) spans the same width as the other field buttons ---- */\r
table.field div[role="radiogroup"][title^="Are there Spikes"] { display: inline-flex; width: 121.6px; vertical-align: middle; }\r
table.field div[role="radiogroup"][title^="Are there Spikes"] label[for^="spikes"] { width: auto; flex: 1 1 0; box-sizing: border-box; padding-left: 0; padding-right: 0; white-space: nowrap; }\r
table.field div[role="radiogroup"][title^="Are there Spikes"] label.btn-spikes { flex: 3.6 1 0; }\r
\r
/* ---- Remix: Reset team buttons + item-status toggle ---- */\r
.remix-reset-row { margin: 6px 4px 0; }\r
.remix-reset-row.left { text-align: left; }\r
.remix-reset-row.right { text-align: right; }\r
.remix-reset-team { border: 1px solid #9cc7a4; background: #eef8f0; color: #2f7a3d; border-radius: 6px; padding: 2px 10px; font-size: 12px; font-weight: bold; cursor: pointer; transition: background .15s, transform .15s; }\r
.remix-reset-team:hover { background: #d9f0de; transform: scale(1.04); }\r
body.dark .remix-reset-team { background: #1f3326; border-color: #3d6b4a; color: #9fe0ad; }\r
body.dark .remix-reset-team:hover { background: #29452f; }\r
\r
/* ---- Remix: residual toggles row + Imposter "Transformed" ---- */\r
table.field .remix-residual { display: inline-flex; width: 121.6px; vertical-align: middle; }\r
table.field .remix-residual label.btn { width: auto !important; flex: 1 1 auto; box-sizing: border-box; padding-left: 2px; padding-right: 2px; font-size: 0.72em; white-space: nowrap; }\r
.poke-info .remix-transform { display: inline-block; width: auto; margin-left: 6px; font-size: 11px; white-space: nowrap; cursor: pointer; }\r
.poke-info .remix-transform input { margin: 0 2px 0 0; vertical-align: middle; }\r
\r
/* ---- Remix: move rows (effective type/BP/category overlay, PP counter) ---- */\r
.poke-info .move1, .poke-info .move2, .poke-info .move3, .poke-info .move4 { position: relative; }\r
.poke-info .remix-eff { position: absolute; pointer-events: none; font-style: italic; box-sizing: border-box; margin: 0; z-index: 2; }\r
.poke-info input.remix-eff { text-align: center; background: #fff; color: #222; border: 1px solid #b9b0c6; border-radius: 3px; padding: 0; font-weight: bold; }\r
body.dark .poke-info input.remix-eff { background: #2b2533; color: #fff; border-color: #6a5a86; }\r
.poke-info select.remix-eff { font-weight: bold; }\r
.poke-info .remix-pp { display: inline-flex; width: auto; align-items: center; gap: 1px; margin-left: 4px; font-size: 11px; white-space: nowrap; vertical-align: middle; }\r
.poke-info .remix-pp button { width: 14px; height: 16px; padding: 0; border: 1px solid #b9b0c6; background: #f4f0f8; color: #5b4a73; border-radius: 3px; line-height: 13px; font-size: 11px; cursor: pointer; }\r
body.dark .poke-info .remix-pp button { background: #2b2435; border-color: #4a4058; color: #fff; }\r
.poke-info .remix-pp .pp-val { display: inline-block; width: auto; min-width: 34px; text-align: center; cursor: pointer; border-radius: 3px; }\r
.poke-info .remix-pp.used .pp-val { font-weight: bold; background: rgba(235, 160, 40, 0.18); }\r
.poke-info .remix-pp.empty .pp-val { font-weight: bold; background: rgba(220, 70, 60, 0.25); }\r
/* move rows: one even line (move name takes the leftover width), PP counter at the end */\r
.poke-info .move1, .poke-info .move2, .poke-info .move3, .poke-info .move4 { display: flex; flex-wrap: wrap; align-items: center; column-gap: 4px; row-gap: 2px;\r
	width: calc(100% + 22px); box-sizing: border-box; } /* reaches the right edge of the type chart */\r
.poke-info [class^="move"] > .select2-container.move-selector { flex: 1 1 0; min-width: 80px; width: auto !important; }\r
.poke-info [class^="move"] > .move-bp { flex: 0 0 30px; margin: 0; }\r
.poke-info [class^="move"] > .move-type { flex: 0 0 66px; width: 66px !important; min-width: 0; margin: 0; }\r
.poke-info [class^="move"] > .move-cat { flex: 0 0 54px; width: 54px !important; min-width: 0; padding-left: 4px; padding-right: 0; margin: 0; }\r
.poke-info [class^="move"] > label.btn { margin: 0; }\r
.poke-info .remix-pp { flex: 0 0 auto; margin-left: auto; gap: 5px; }\r
.poke-info .remix-pp button { width: 16px; }\r
.poke-info .remix-pp .pp-val { min-width: 38px; font-size: 11px; }\r
\r
/* changed category: same dropdown look (arrow kept), bold italic in a slightly smaller font so it fits */\r
.poke-info select.remix-eff-cat { font-size: 11px; padding-left: 3px; padding-right: 0; opacity: 1; }\r
.poke-info select.remix-eff-cat { color: #222; -webkit-text-fill-color: #222; background-color: #fff; }\r
body.dark .poke-info select.remix-eff-cat { color: #fff; -webkit-text-fill-color: #f0e6ff; background-color: #2b2533; border: 1px solid #6a5a86; }\r
\r
/* changed move type: crisp pill text (not greyed like a disabled box), slightly smaller so italic fits */\r
.poke-info select.remix-eff-type { opacity: 1; color: #fff; -webkit-text-fill-color: #fff; font-size: 11px; padding-left: 2px; padding-right: 0; }\r
/* top move buttons: italic + bold when an ability/item changed the move's type */\r
label.result-changed { font-style: italic; font-weight: bold; }\r
/* Reset team: tucked up right under the team box, in its corner */\r
.remix-reset-row { margin: -17px 3px 0; }\r
.remix-reset-team { padding: 1px 8px; font-size: 11px; }\r
\r
/* ---- Remix: nature box = name + smaller "+Atk/-SpA" ---- */\r
.poke-info select.remix-nature-select { color: transparent; }\r
.poke-info select.remix-nature-select option { color: #222; }\r
body.dark .poke-info select.remix-nature-select option { color: #fff; }\r
.poke-info .remix-nature-label { position: absolute; display: flex; align-items: center; width: auto; box-sizing: border-box; padding: 0 18px 0 4px; pointer-events: none; overflow: hidden; white-space: nowrap; }\r
.poke-info .remix-nature-label .n-name { display: inline; width: auto; }\r
.poke-info .remix-nature-label .n-stats { display: inline; width: auto; font-size: 10px; opacity: .85; margin-left: 2px; }\r
\r
/* base power boxes: centered text (matches the changed-power overlay) */\r
.poke-info [class^="move"] > .move-bp { text-align: center; padding-left: 0; padding-right: 0; }\r
\r
/* Item status: small tick box + "item" after the status emoji */\r
.poke-info .remix-item-status { display: inline-flex; align-items: center; gap: 3px; margin: 0 6px 0 2px; font-size: 12px; line-height: 1; vertical-align: middle; cursor: pointer; color: #7a5a10; white-space: nowrap; }\r
.poke-info .remix-item-status input { margin: 0; width: 13px; height: 13px; cursor: pointer; }\r
.poke-info .status-row select.toxic-counter { box-sizing: border-box; min-width: 0; padding: 0 2px; }\r
.poke-info .remix-item-status.off { color: #8a8294; }\r
body.dark .poke-info .remix-item-status { color: #f0d58f; }\r
body.dark .poke-info .remix-item-status.off { color: #9a90a8; }\r
\r
/* ---- Type chart values: greens = weak (2x/4x/8x), reds get darker as resists stack, 0 = immune ---- */\r
.tc-val { font-weight: bold; color: inherit; }\r
.tc-val.tc-w1 { background: #2fae7a !important; color: #fff; }\r
.tc-val.tc-w2 { background: #17845a !important; color: #fff; }\r
.tc-val.tc-w3 { background: #0a5236 !important; color: #fff; }\r
.tc-val.tc-r1 { background: #c45b5b !important; color: #fff; }\r
.tc-val.tc-r2 { background: #9a2e2e !important; color: #fff; }\r
.tc-val.tc-r3 { background: #6b1717 !important; color: #fff; }\r
.tc-val.tc-r4 { background: #3a0606 !important; color: #f3c9c9; }\r
.tc-val.tc-immune { background: #1b1820 !important; color: #a9a2b3; }\r
/* changed by the ability or item: italics + a small mark */\r
.tc-val.tc-from { font-style: italic; }\r
.tc-val.tc-from::after { content: "*"; font-size: 0.85em; margin-left: 1px; opacity: 0.85; }\r
.tc-cell[title] { cursor: help; }\r
.tc-toggle { display: block; margin: 4px auto 0; font-size: 0.68em; padding: 1px 6px; border-radius: 5px; cursor: pointer;\r
	background: transparent; border: 1px solid rgba(128,128,128,0.6); color: inherit; opacity: 0.8; white-space: nowrap; }\r
.tc-toggle:hover { opacity: 1; }\r
body.tc-hidden .type-chart .tc-title, body.tc-hidden .type-chart .tc-grid { display: none; }\r
/* Third type from an item (Rusty Anchor) */\r
.poke-info select.remix-type3 { opacity: 1; cursor: default; }\r
/* three type pills: narrower so they stay left of the sprite */\r
.poke-info.has-type3 select.type1, .poke-info.has-type3 select.type2, .poke-info.has-type3 select.remix-type3 {\r
	min-width: 0; padding: 0 1px; font-size: 0.8em; } /* widths set in remix_typechart.js */\r
/* white outline around each type cell (tile + value), 0x text white */\r
.tc-cell { border: 1px solid #fff !important; }\r
.tc-val.tc-immune { color: #fff; }\r
.tc-toggle { font-size: 0.8em; padding: 3px 10px; margin-top: 6px; border-radius: 6px; }\r
\r
/* ---- type chart v3: value part taller (~60%), divider line, crisp white text, borders black in dark mode ---- */\r
.tc-tile { font-size: 0.7em; line-height: 11px; padding: 1px 0; text-shadow: 0 1px 1px rgba(0,0,0,0.75); }\r
.tc-val { font-size: 0.8em; min-height: 16px; line-height: 16px; border-top: 1px solid #fff; color: #fff; text-shadow: 0 1px 1px rgba(0,0,0,0.45); }\r
/* borders: black in both modes */\r
.tc-cell { border-color: #000 !important; }\r
.tc-val { border-top-color: #000; }\r
\r
body:not(.dark) .tc-val:not([class*="tc-w"]):not([class*="tc-r"]):not(.tc-immune) { color: inherit; text-shadow: none; }\r
.tc-title { opacity: 1; }\r
/* greens: true greens (a bit off Grass's yellow-green); reds: clear red getting darker */\r
.tc-val.tc-w1 { background: #3daa4c !important; color: #fff; }\r
.tc-val.tc-w2 { background: #22873a !important; color: #fff; }\r
.tc-val.tc-w3 { background: #0f5a24 !important; color: #fff; }\r
.tc-val.tc-r1 { background: #d83434 !important; color: #fff; }\r
.tc-val.tc-r2 { background: #a51f1f !important; color: #fff; }\r
.tc-val.tc-r3 { background: #6c1010 !important; color: #fff; }\r
.tc-val.tc-r4 { background: #380505 !important; color: #fff; }\r
.tc-val.tc-immune { color: #fff; }\r
body.dark .select2-container .select2-choice, body.dark .select2-chosen { color: #fff; }\r
/* ---- type chart values tinted (like the HP % box) instead of solid; immune stays solid black ---- */\r
.tc-val.tc-w1 { background: rgba(61, 170, 76, 0.32) !important; }\r
.tc-val.tc-w2 { background: rgba(34, 135, 58, 0.5) !important; }\r
.tc-val.tc-w3 { background: rgba(15, 110, 40, 0.7) !important; }\r
.tc-val.tc-r1 { background: rgba(216, 52, 52, 0.28) !important; }\r
.tc-val.tc-r2 { background: rgba(190, 35, 35, 0.42) !important; }\r
.tc-val.tc-r3 { background: rgba(150, 20, 20, 0.58) !important; }\r
.tc-val.tc-r4 { background: rgba(100, 8, 8, 0.75) !important; }\r
/* light mode: tints are pale, so dark text reads better there */\r
body:not(.dark) .tc-val[class*="tc-w"], body:not(.dark) .tc-val[class*="tc-r"] { color: #1d1a22; text-shadow: none; }\r
/* Type / Forme / Nature / Level: boxes closer to their labels (more room for the sprite) */\r
.poke-info .info-group.top label { width: 4.3em; }\r
/* Singles / Doubles: as wide as the Reflect / Light Screen columns, bigger text */\r
div[aria-labelledby="selectBattleFormatInstruction"] { width: auto !important; display: flex; margin: 0 -2px 6px !important; }\r
div[aria-labelledby="selectBattleFormatInstruction"] label { flex: 1; text-align: center; font-size: 1.15em !important; padding: 4px 0 !important; }\r
/* toxic counter: smaller */\r
.poke-info .status-row select.toxic-counter { font-size: 0.85em; padding: 0 1px; }\r
body.item-sprites-hidden .poke-info .remix-item-big, body.main-sprites-hidden .poke-info .remix-mini { display: none !important; }\r
.poke-info select.remix-type3 { margin-left: 4px; }\r
/* Status row: label hugs its text, emoji and status box follow straight after */\r
.poke-info .status-row > label { width: auto; margin-right: 6px; }\r
.poke-info .status-row .remix-status-emoji { display: inline-block; width: auto; margin-right: 4px; }\r
.poke-info .status-row select.toxic-counter { font-size: 1em; padding: 0 2px; }\r
\r
/* Title hint */\r
.title-hint { font-size: 12px; font-weight: normal; font-style: italic; margin-left: 10px; opacity: 0.9; vertical-align: baseline; }\r
/* ---- type chart: clearer steps. Reds deepen with each halving, greens get more vivid with each doubling ---- */\r
.tc-val.tc-w1 { background: rgba(61, 170, 76, 0.30) !important; }\r
.tc-val.tc-w2 { background: rgba(0, 200, 110, 0.62) !important; }\r
.tc-val.tc-w3 { background: rgba(0, 235, 150, 0.85) !important; }\r
.tc-val.tc-r1 { background: rgba(220, 60, 60, 0.28) !important; }\r
.tc-val.tc-r2 { background: rgba(170, 20, 20, 0.62) !important; }\r
.tc-val.tc-r3 { background: rgba(115, 5, 5, 0.85) !important; }\r
.tc-val.tc-r4 { background: rgba(60, 0, 0, 0.97) !important; }\r
body:not(.dark) .tc-val.tc-w2, body:not(.dark) .tc-val.tc-w3, body:not(.dark) .tc-val.tc-r2,\r
body:not(.dark) .tc-val.tc-r3, body:not(.dark) .tc-val.tc-r4 { color: #fff; text-shadow: 0 1px 1px rgba(0,0,0,0.45); }\r
\r
/* ---- Doubles AI panel ---- */\r
.dai-panel { display: block; clear: both; box-sizing: border-box; width: min(900px, 100%); margin: 14px auto 10px; border-radius: 10px; padding: 8px 14px 12px; }\r
.dai-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 0.85em; margin-bottom: 6px; }\r
.dai-hint { font-style: italic; opacity: 0.85; }\r
.dai-rules label { margin-left: 10px; cursor: pointer; }\r
.dai-arena { position: relative; display: flex; justify-content: space-between; align-items: stretch; min-height: 230px; padding: 4px 0; }\r
.dai-col { display: flex; flex-direction: column; justify-content: space-around; gap: 10px; width: 230px; z-index: 1; }\r
.dai-ai { align-items: flex-end; }\r
.dai-slot { display: flex; flex-direction: column; align-items: center; gap: 2px; }\r
.dai-slot select { width: 220px; }\r
.dai-slot img { width: 120px; height: 90px; image-rendering: pixelated; visibility: hidden; }\r
.dai-you .dai-slot img { transform: scaleX(-1); }\r
.dai-hp { font-size: 0.8em; opacity: 0.85; min-height: 1.1em; }\r
.dai-arrows { position: absolute; left: 0; top: 0; pointer-events: none; overflow: visible; }\r
.dai-arrow { fill: none; stroke-width: 3; stroke: #e05a5a; opacity: 0.9; }\r
.dai-arrow-spread { stroke-dasharray: 7 5; stroke: #e09a3a; }\r
.dai-arrow-status { stroke-dasharray: 3 5; stroke: #9a7ae0; }\r
.dai-arrowhead { fill: #e05a5a; }\r
.dai-label { font-size: 12px; font-weight: bold; fill: #fff; paint-order: stroke; stroke: #17141c; stroke-width: 3px; }\r
body:not(.dark) .dai-label { fill: #1d1a22; stroke: #fff; }\r
.dai-result { margin-top: 8px; font-size: 0.95em; }\r
.dai-line { padding: 3px 0; }\r
.dai-note { font-size: 0.8em; opacity: 0.75; margin-left: 12px; }\r
.dai-ko { color: #ff6b6b; font-weight: bold; }\r
.dai-maybe { font-size: 0.85em; font-style: italic; opacity: 0.8; }\r
.dai-empty { font-style: italic; opacity: 0.8; }\r
.dai-details { margin-top: 8px; font-size: 0.85em; }\r
.dai-details summary { cursor: pointer; }\r
.dai-table { border-collapse: collapse; margin-top: 4px; }\r
.dai-table th, .dai-table td { border: 1px solid rgba(128,128,128,0.4); padding: 2px 8px; text-align: left; }\r
#dai-panel.dai-panel { float: none !important; margin-top: 14px !important; margin-bottom: 10px !important; max-width: none; }\r
/* Doubles AI: compact */\r
.dai-arena { min-height: 170px; }\r
.dai-col { width: 200px; gap: 4px; }\r
.dai-slot select { width: 195px; }\r
.dai-slot img { width: 80px; height: 60px; }\r
.dai-arrow-maybe { stroke-dasharray: 8 6; opacity: 0.75; }\r
.dai-result { font-size: 0.9em; }\r
/* Show / Hide Doubles AI Calc button (above Singles / Doubles) */\r
.dai-open { display: block; width: calc(100% + 4px); margin: 0 -2px 6px; padding: 4px 0; border-radius: 6px; cursor: pointer; font-weight: bold;\r
	font-size: 1.05em; background: #2b2435; color: #fff; border: 1px solid #6e5a88; }\r
.dai-open:hover { background: #3a3046; }\r
.dai-open.on { background: #4a3a66; border-color: #c9a6ef; }\r
body:not(.dark) .dai-open { background: #efe6fb; color: #2b2533; border-color: #b9a2d8; }\r
body:not(.dark) .dai-open.on { background: #dccbf5; }\r
.dai-sure { font-size: 0.8em; font-weight: bold; color: #5fd07a; margin-left: 4px; }\r
/* Doubles AI: "Show the AI's math" dropdown */\r
.dai-details summary { list-style: none; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px;\r
	border: 1px solid rgba(160,140,200,0.6); background: rgba(160,140,200,0.12); }\r
.dai-details summary::-webkit-details-marker { display: none; }\r
.dai-details summary::before { content: "▸"; display: inline-block; transition: transform .15s ease; }\r
.dai-details[open] summary::before { transform: rotate(90deg); }\r
.dai-details summary:hover { background: rgba(160,140,200,0.22); }\r
.dai-sum-title { font-weight: bold; }\r
.dai-sum-hint { font-style: italic; opacity: 0.8; font-size: 0.9em; }\r
.dai-sub { margin: 8px 0 2px; font-size: 0.9em; opacity: 0.85; }\r
.dai-table tr.dai-pick td { background: rgba(95, 208, 122, 0.15); font-weight: bold; }\r
.dai-open .dai-open-hint { font-weight: normal; font-style: italic; }\r
/* End-of-turn residual row (above Current HP) */\r
.poke-info .remix-residual { font-size: 0.82em; line-height: 1.35; margin: 2px 0 4px; padding: 3px 6px; border-radius: 6px;\r
	background: rgba(128,128,128,0.1); box-sizing: border-box; cursor: help; } /* width set in remix_residual.js */\r
.poke-info .remix-residual span { display: inline; width: auto; }\r
.remix-residual .rr-label { opacity: 0.8; }\r
.remix-residual .rr-heal { color: #5fd07a; }\r
.remix-residual .rr-chip { color: #ff7b7b; }\r
body:not(.dark) .remix-residual .rr-heal { color: #1e8a3a; }\r
body:not(.dark) .remix-residual .rr-chip { color: #c02a2a; }\r
.remix-residual .rr-steps { opacity: 0.9; }\r
.remix-residual .rr-end { opacity: 0.8; }\r
.remix-residual .rr-faint { color: #ff5a5a; font-weight: bold; }\r
.dai-reveal { font-size: 0.78em; cursor: pointer; opacity: 0.9; }\r
.dai-reveal input { vertical-align: middle; }\r
/* Fixed sizes so switching Pokemon never changes the panel height */\r
.poke-info .remix-residual { line-height: 1.3; }\r
.remix-residual .rr-none { opacity: 0.5; font-style: italic; }\r
.poke-info .info-group.top { min-height: 80px; } /* room for the Forme row even when there's none */\r
.poke-info .status-row { height: 20px; overflow: visible; } /* same height with or without the toxic 1/16 box */\r
\r
/* Doubles AI arrows: colour = kind of move, dotted = not guaranteed (spread/status are no longer dashed by default) */\r
.dai-arrow { stroke-dasharray: none !important; }\r
.dai-arrow.dai-arrow-maybe { stroke-dasharray: 2 6 !important; stroke-linecap: round; opacity: 0.85; }\r
.dai-c-red { stroke: #e05a5a; } .dai-head-red { fill: #e05a5a; }\r
.dai-c-orange { stroke: #ee8f2a; } .dai-head-orange { fill: #ee8f2a; }\r
.dai-c-yellow { stroke: #f2d13a; } .dai-head-yellow { fill: #f2d13a; }\r
.dai-c-purple { stroke: #a98ae6; } .dai-head-purple { fill: #a98ae6; }\r
.dai-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 0.75em; opacity: 0.85; margin: 2px 0 4px; justify-content: center; }\r
.dai-legend span { display: inline-flex; align-items: center; gap: 5px; }\r
.dai-sw { display: inline-block; width: 22px; height: 0; border-top: 3px solid; }\r
.dai-sw.dai-c-red { border-color: #e05a5a; } .dai-sw.dai-c-orange { border-color: #ee8f2a; }\r
.dai-sw.dai-c-yellow { border-color: #f2d13a; } .dai-sw.dai-c-purple { border-color: #a98ae6; }\r
.dai-sw.dai-solid { border-color: currentColor; } .dai-sw.dai-dotted { border-top-style: dotted; border-color: currentColor; }\r
/* Doubles AI: results left, legend right (same rows), math table full width below */\r
.dai-bottom { display: flex; gap: 16px; align-items: stretch; margin-top: 4px; }\r
.dai-left { flex: 1; min-width: 0; }\r
.dai-panel .dai-legend { display: grid; grid-template-columns: repeat(3, auto); gap: 4px 14px; align-content: center;\r
	font-size: 0.8em; opacity: 0.95; margin: 0; padding: 6px 10px; border-radius: 6px; background: rgba(128,128,128,0.1); white-space: nowrap; }\r
.dai-panel .dai-legend span { display: inline; }\r
.dai-t-red { color: #e05a5a; } .dai-t-orange { color: #ee8f2a; } .dai-t-yellow { color: #f2d13a; } .dai-t-purple { color: #a98ae6; }\r
body:not(.dark) .dai-t-yellow { color: #b8960a; }\r
.dai-result { margin-top: 0; }\r
.dai-sure, .dai-unsure { font-size: 0.8em; margin-left: 12px; }\r
.dai-sure { color: #5fd07a; font-weight: bold; }\r
.dai-unsure { color: #e0b05a; }\r
.dai-table-wrap { margin-top: 6px; font-size: 0.85em; }\r
.dai-panel .dai-legend { flex: 0 0 auto; font-size: 0.72em; gap: 3px 10px; padding: 5px 8px; align-self: center; }\r
.dai-left { min-width: 380px; }\r
.dai-details summary { white-space: nowrap; } .dai-sum-hint { font-size: 0.82em; }\r
/* Doubles AI legend: fills the space beside the results (same height), text + a sample line under each */\r
.dai-bottom { align-items: stretch; }\r
.dai-panel .dai-legend { flex: 1 1 auto; align-self: stretch; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: 1fr 1fr;\r
	gap: 6px 14px; font-size: 0.9em; padding: 8px 14px; white-space: nowrap; }\r
.dai-lg { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 5px; }\r
.dai-ln { display: block; width: 70%; height: 0; border-top: 4px solid; }\r
.dai-ln-red { border-color: #e05a5a; } .dai-ln-orange { border-color: #ee8f2a; } .dai-ln-yellow { border-color: #f2d13a; }\r
.dai-ln-purple { border-color: #a98ae6; } .dai-ln-solid { border-color: currentColor; }\r
.dai-ln-dotted { border-top-style: dotted; border-color: currentColor; }\r
.dai-left { flex: 0 0 auto; min-width: 0; }\r
.remix-apply.heals { border-color: #3f9a5a; }\r
body.dark .remix-apply.heals { border-color: #4fb56b; color: #c9f3d4; }\r
/* type chart: neutral (1x) cells show the panel's own background instead of a dark tint */\r
.tc-val:not([class*="tc-w"]):not([class*="tc-r"]):not(.tc-immune), body:not(.dark) .tc-val:not([class*="tc-w"]):not([class*="tc-r"]):not(.tc-immune) { background: transparent; }\r
`,se={datasetId:"local:datasetId",pokedex:"local:pokedex",moves:"local:moves",sheetId:"local:sheetId",pinnedMoves:"session:pinnedMoves",pinnedPokemon:"session:pinnedPokemon"},Lr={"Dry Skin":{Fire:1.25,Water:0},Filter:{"Super Effective":.75},"Flash Fire":{Fire:0},Fluffy:{Fire:2},"Guarding Gale":{Electric:.5,Ice:.5,Rock:.5},Heatproof:{Fire:.5},Levitate:{Ground:0},"Lightning Rod":{Electric:0},"Liquid Veil":{Fire:.5},Resilient:{"Super Effective":.75},"Solid Rock":{"Super Effective":.75},"Storm Drain":{Water:0},"Thick Fat":{Fire:.5,Ice:.5},"Volt Absorb":{Electric:0},"Water Absorb":{Water:0}},ke={Normal:{Fighting:2,Ghost:0},Fire:{Fire:.5,Water:2,Grass:.5,Ice:.5,Ground:2,Bug:.5,Rock:2,Steel:.5,Fairy:.5},Water:{Fire:.5,Water:.5,Electric:2,Grass:2,Ice:.5,Steel:.5},Electric:{Electric:.5,Ground:2,Flying:.5,Steel:.5},Grass:{Fire:2,Water:.5,Electric:.5,Grass:.5,Ice:2,Poison:2,Ground:.5,Flying:2,Bug:2},Ice:{Fire:2,Ice:.5,Fighting:2,Rock:2,Steel:2},Fighting:{Flying:2,Psychic:2,Bug:.5,Rock:.5,Dark:.5,Fairy:2},Poison:{Grass:.5,Fighting:.5,Poison:.5,Ground:2,Psychic:2,Bug:.5,Fairy:.5},Ground:{Water:2,Electric:0,Grass:2,Ice:2,Poison:.5,Rock:.5},Flying:{Electric:2,Grass:.5,Ice:2,Fighting:.5,Ground:0,Bug:.5,Rock:2},Psychic:{Fighting:.5,Psychic:.5,Bug:2,Ghost:2,Dark:2},Bug:{Fire:2,Grass:.5,Fighting:.5,Ground:.5,Flying:2,Rock:2},Rock:{Normal:.5,Fire:.5,Water:2,Grass:2,Fighting:2,Poison:.5,Ground:2,Flying:.5,Steel:2},Ghost:{Normal:0,Fighting:0,Poison:.5,Bug:.5,Ghost:2,Dark:2},Dragon:{Fire:.5,Water:.5,Electric:.5,Grass:.5,Ice:2,Dragon:2,Fairy:2},Dark:{Fighting:2,Psychic:0,Bug:2,Ghost:.5,Dark:.5,Fairy:2},Steel:{Normal:.5,Fire:2,Grass:.5,Ice:.5,Fighting:2,Poison:0,Ground:2,Flying:.5,Psychic:.5,Bug:.5,Rock:.5,Dragon:.5,Steel:.5,Fairy:.5},Fairy:{Fighting:.5,Poison:2,Bug:.5,Dragon:0,Dark:.5,Steel:2},...Lr},or=Object.keys(Lr),vt=[{value:"remix",label:"Sweltering Sun",sheetId:"1qXyNhB8KGqqCExq-dYXUIm1FGgHfpjvuvps1V6npFnU",dexitedPokemon:new Set(["mimikyubusted","mimikyubustedtotem","magearnaoriginal"]),unusable:new Set,magicItems:{"Shiny Scale":{abilities:["Magic Bounce"]}},signatureItems:{ariados:"Shiny Scale",spinarak:"Shiny Scale",bagon:"Shiny Scale",shelgon:"Shiny Scale",salamence:"Shiny Scale"},typeChart:{...ke,Ice:{...ke.Ice,Ice:0},Fighting:{...ke.Fighting,Bug:1},Poison:{...ke.Poison,Water:2},Rock:{...ke.Rock,Bug:.5},Ghost:{...ke.Ghost,Bug:1},Fairy:{...ke.Fairy,Bug:1},"Shiny Scale":{Dragon:.5}},tcAbilities:[...or],tcItems:["Shiny Scale"],tciOnlyIf:{"Shiny Scale":["Ariados","Spinarak"]}},{value:"scrambled",label:"Scrambled Scarlet",sheetId:"1aSg996CVQ6RZwi9LPXVST73kV5lkznPd50rvDNqndqs",dexitedPokemon:new Set(["caterpie","weedle","pidgey","rattata","spearow","nidoranf","nidoranm","zubat","paras","abra","machop","ponyta","farfetchd","onix","krabby","cubone","lickitung","tangela","kangakhan","goldeen","staryu","mimejr","mrmime","smoochum","pinsir","omanyte","kabuto","aerodactyl","ledyba","togepi","natu","unown","wynaut","shuckle","corsola","remoraid","mantyke","miltank","celebi","zigzagoon","wurmple","taillow","nincada","shedinja","whismur","skitty","mawile","aron","electrike","budew","carvanha","wailmer","spinda","lunatone","solrock","baltoy","lileep","anorith","castform","kecleon","absol","spheal","clamperl","relicanth","bidoof","burmy","cherubi","buneary","glameow","chatot","skorupi","carnivine","victini","patrat","lillipup","purrloin","pansage","pansear","panpour","munna","pidove","roggenrola","woobat","audino","tympole","palpitoad","throh","sawk","venipede","darumaka","maractus","dwebble","sigilyph","yamask","tirtouga","archen","trubbish","vanillite","emolga","karrablast","frillish","ferroseed","kling","elgyem","shelmet","stunfisk","druddigon","bouffalant","heatmor","durant","genesect","bunnelby","pancham","furfrou","honedge","spritzee","swirlix","binacle","helioptile","tyrunt","amaura","pumpkaboo","xerneas","yveltal","zygarde","wishiwashi","morelull","stufful","wimpod","pyukumuku","typenull","turtonator","togedemaru","drampa","dhelmise","tapukoko","tapulele","tapubulu","tapufini","nihilego","buzzwole","pheromosa","xurkitree","celesteela","kartana","guzzlord","marshadow","poipole","stakataka","blacephalon","meltan","blipbug","nickit","gossifleur","wooloo","yamper","sizzlipede","clobbopus","dracozolt","arctizolt","dracovish","arctivish","lugia","ho-oh","kyogre","groudon","dialga","palkia","zekrom","reshiram","kyuremblack","kyuremwhite","solgaleo","lunala","necrozmadusk","necrozmadawn","necrozmaultra","zacian","zamazenta","calyrex","mimikyubusted","mimikyubustedtotem","magearnaoriginal"]),unusable:new Set(["koraidon","miraidon"]),magicItems:{},signatureItems:{},typeChart:{...ke,"Earth Eater":{Ground:0}},tcAbilities:[...or,"Earth Eater"],tcItems:[],tciOnlyIf:{}}],eo=[{value:"pokedex",label:"Pokemon"},{value:"moves",label:"Moves/Type Chart"}],ir=JSON.parse(Xe.slice(Xe.indexOf("[",Xe.indexOf("REMIX_STAT_COLORS")),Xe.indexOf("]",Xe.indexOf("REMIX_STAT_COLORS"))+1)),to=e=>ir[Math.max(0,Math.min(ir.length-1,Math.floor(e/10)))],Dr=Object.fromEntries([...Qn.matchAll(/select\.type-pill option\[value="(\w+)"\] \{ background: (#[0-9a-fA-F]{3,8})/g)].map(e=>[e[1],e[2]])),wt=[{label:"(Type)",value:""},{label:"Normal",value:"Normal"},{label:"Fire",value:"Fire"},{label:"Water",value:"Water"},{label:"Grass",value:"Grass"},{label:"Electric",value:"Electric"},{label:"Ice",value:"Ice"},{label:"Fighting",value:"Fighting"},{label:"Poison",value:"Poison"},{label:"Ground",value:"Ground"},{label:"Flying",value:"Flying"},{label:"Psychic",value:"Psychic"},{label:"Bug",value:"Bug"},{label:"Rock",value:"Rock"},{label:"Ghost",value:"Ghost"},{label:"Dragon",value:"Dragon"},{label:"Dark",value:"Dark"},{label:"Steel",value:"Steel"},{label:"Fairy",value:"Fairy"}],ro=[{label:"(Category)",value:""},{label:"Physical",value:"Physical"},{label:"Special",value:"Special"},{label:"Status",value:"Status"}],no={},jr="remix",sr=new Set(["local:pokedex","local:moves","local:sheetId","local:datasetId"]),at=new Map,Ye=new Map,lr=e=>{try{return e.startsWith("session:")?sessionStorage:localStorage}catch{return null}},ar=e=>"doozdex:"+e,ee={async getItem(e){var r;if(e==="local:datasetId")return jr;if(at.has(e))return at.get(e);if(sr.has(e))return null;try{const t=(r=lr(e))==null?void 0:r.getItem(ar(e));if(t!=null){const n=JSON.parse(t);return at.set(e,n),n}}catch{}return null},async setItem(e,r){var t,n;if(at.set(e,r),!sr.has(e))try{(t=lr(e))==null||t.setItem(ar(e),JSON.stringify(r))}catch{}(n=Ye.get(e))==null||n.forEach(o=>o(r))},watch(e,r){return Ye.has(e)||Ye.set(e,new Set),Ye.get(e).add(r),()=>{var t;return(t=Ye.get(e))==null?void 0:t.delete(r)}}};let $t=null;async function oo(e){const r=await fetch(globalThis.__DZ_BASE+"data.json",{cache:"no-cache"});if(!r.ok)throw new Error("Failed to load data.json: "+r.status);const t=await r.json(),n=jr;await ee.setItem("local:pokedex",t.pokedex),await ee.setItem("local:moves",t.moves),await ee.setItem("local:sheetId",t.sheetId),await ee.setItem("local:datasetId",n)}const Le={runtime:{sendMessage(e){return e.action!=="updateData"?Promise.resolve(void 0):($t??($t=oo(e.datasetId??"").then(()=>({success:!0})).catch(r=>(console.error(r),{success:!1})).finally(()=>$t=null)),$t)}},tabs:{async query(){return[]},async update(e,{url:r}){window.open(r,"_blank","noopener")},async create({url:e}){window.open(e,"_blank","noopener")}}},Nr=Ee(),Gr=()=>{const e=Me(Nr);if(e===void 0)throw new Error("usePinnedMoves must be used within a PinnedProvider");return e},io=e=>{const[r,t]=N(new Set);return Be(async()=>{const n=await ee.getItem(se.pinnedMoves);n&&t(new Set(n))}),tt(()=>ee.setItem(se.pinnedMoves,[...r()])),I(Nr.Provider,{value:[r,t],get children(){return e.children}})},Wr=Ee(),Br=Ee(),Vr=Ee(),Ur=Ee(),qr=Ee(),Kr=Ee(),so=e=>{const[r,t]=N(null),[n,o]=N(null),[i,l]=N(null),[s,a]=N(null),[c,d]=N(!1),[u,h]=N(null);let f=null,m=null,x=null,w=null;return Be(async()=>{const E=await ee.getItem(se.datasetId);E&&t(E);const b=await ee.getItem(se.pokedex);b&&o(b);const k=await ee.getItem(se.moves);k&&l(k);const _=await ee.getItem(se.sheetId);_&&a(_),d(!0),f=ee.watch(se.datasetId,v=>t(v)),m=ee.watch(se.pokedex,v=>o(v)),x=ee.watch(se.moves,v=>l(v)),w=ee.watch(se.sheetId,v=>a(v))}),Ot(()=>{f==null||f(),m==null||m(),x==null||x(),w==null||w()}),I(Wr.Provider,{value:r,get children(){return I(Br.Provider,{value:n,get children(){return I(Vr.Provider,{value:i,get children(){return I(Ur.Provider,{value:s,get children(){return I(qr.Provider,{value:c,get children(){return I(Kr.Provider,{value:[u,h],get children(){return e.children}})}})}})}})}})}})},it=()=>{const e=Me(Br);if(e===void 0)throw new Error("usePokedex must be used within a DataProvider");return e},lo=()=>{const e=Me(qr);if(e===void 0)throw new Error("useInitialised must be used within a DataProvider");return e},Mt=()=>Me(Kr);function Hr(e){var r,t,n="";if(typeof e=="string"||typeof e=="number")n+=e;else if(typeof e=="object")if(Array.isArray(e)){var o=e.length;for(r=0;r<o;r++)e[r]&&(t=Hr(e[r]))&&(n&&(n+=" "),n+=t)}else for(t in e)e[t]&&(n&&(n+=" "),n+=t);return n}function Pt(){for(var e,r,t=0,n="",o=arguments.length;t<o;t++)(e=arguments[t])&&(r=Hr(e))&&(n&&(n+=" "),n+=r);return n}const ao=(e,r)=>{const t=new Array(e.length+r.length);for(let n=0;n<e.length;n++)t[n]=e[n];for(let n=0;n<r.length;n++)t[e.length+n]=r[n];return t},co=(e,r)=>({classGroupId:e,validator:r}),Xr=(e=new Map,r=null,t)=>({nextPart:e,validators:r,classGroupId:t}),kt="-",cr=[],uo="arbitrary..",fo=e=>{const r=ho(e),{conflictingClassGroups:t,conflictingClassGroupModifiers:n}=e;return{getClassGroupId:l=>{if(l.startsWith("[")&&l.endsWith("]"))return po(l);const s=l.split(kt),a=s[0]===""&&s.length>1?1:0;return Yr(s,a,r)},getConflictingClassGroupIds:(l,s)=>{if(s){const a=n[l],c=t[l];return a?c?ao(c,a):a:c||cr}return t[l]||cr}}},Yr=(e,r,t)=>{if(e.length-r===0)return t.classGroupId;const o=e[r],i=t.nextPart.get(o);if(i){const c=Yr(e,r+1,i);if(c)return c}const l=t.validators;if(l===null)return;const s=r===0?e.join(kt):e.slice(r).join(kt),a=l.length;for(let c=0;c<a;c++){const d=l[c];if(d.validator(s))return d.classGroupId}},po=e=>e.slice(1,-1).indexOf(":")===-1?void 0:(()=>{const r=e.slice(1,-1),t=r.indexOf(":"),n=r.slice(0,t);return n?uo+n:void 0})(),ho=e=>{const{theme:r,classGroups:t}=e;return mo(t,r)},mo=(e,r)=>{const t=Xr();for(const n in e){const o=e[n];qt(o,t,n,r)}return t},qt=(e,r,t,n)=>{const o=e.length;for(let i=0;i<o;i++){const l=e[i];go(l,r,t,n)}},go=(e,r,t,n)=>{if(typeof e=="string"){bo(e,r,t);return}if(typeof e=="function"){xo(e,r,t,n);return}yo(e,r,t,n)},bo=(e,r,t)=>{const n=e===""?r:Zr(r,e);n.classGroupId=t},xo=(e,r,t,n)=>{if(vo(e)){qt(e(n),r,t,n);return}r.validators===null&&(r.validators=[]),r.validators.push(co(t,e))},yo=(e,r,t,n)=>{const o=Object.entries(e),i=o.length;for(let l=0;l<i;l++){const[s,a]=o[l];qt(a,Zr(r,s),t,n)}},Zr=(e,r)=>{let t=e;const n=r.split(kt),o=n.length;for(let i=0;i<o;i++){const l=n[i];let s=t.nextPart.get(l);s||(s=Xr(),t.nextPart.set(l,s)),t=s}return t},vo=e=>"isThemeGetter"in e&&e.isThemeGetter===!0,wo=e=>{if(e<1)return{get:()=>{},set:()=>{}};let r=0,t=Object.create(null),n=Object.create(null);const o=(i,l)=>{t[i]=l,r++,r>e&&(r=0,n=t,t=Object.create(null))};return{get(i){let l=t[i];if(l!==void 0)return l;if((l=n[i])!==void 0)return o(i,l),l},set(i,l){i in t?t[i]=l:o(i,l)}}},Wt="!",dr=":",ko=[],ur=(e,r,t,n,o)=>({modifiers:e,hasImportantModifier:r,baseClassName:t,maybePostfixModifierPosition:n,isExternal:o}),So=e=>{const{prefix:r,experimentalParseClassName:t}=e;let n=o=>{const i=[];let l=0,s=0,a=0,c;const d=o.length;for(let x=0;x<d;x++){const w=o[x];if(l===0&&s===0){if(w===dr){i.push(o.slice(a,x)),a=x+1;continue}if(w==="/"){c=x;continue}}w==="["?l++:w==="]"?l--:w==="("?s++:w===")"&&s--}const u=i.length===0?o:o.slice(a);let h=u,f=!1;u.endsWith(Wt)?(h=u.slice(0,-1),f=!0):u.startsWith(Wt)&&(h=u.slice(1),f=!0);const m=c&&c>a?c-a:void 0;return ur(i,f,h,m)};if(r){const o=r+dr,i=n;n=l=>l.startsWith(o)?i(l.slice(o.length)):ur(ko,!1,l,void 0,!0)}if(t){const o=n;n=i=>t({className:i,parseClassName:o})}return n},_o=e=>{const r=new Map;return e.orderSensitiveModifiers.forEach((t,n)=>{r.set(t,1e6+n)}),t=>{const n=[];let o=[];for(let i=0;i<t.length;i++){const l=t[i],s=l[0]==="[",a=r.has(l);s||a?(o.length>0&&(o.sort(),n.push(...o),o=[]),n.push(l)):o.push(l)}return o.length>0&&(o.sort(),n.push(...o)),n}},zo=e=>({cache:wo(e.cacheSize),parseClassName:So(e),sortModifiers:_o(e),postfixLookupClassGroupIds:Oo(e),...fo(e)}),Oo=e=>{const r=Object.create(null),t=e.postfixLookupClassGroups;if(t)for(let n=0;n<t.length;n++)r[t[n]]=!0;return r},Io=/\s+/,Ao=(e,r)=>{const{parseClassName:t,getClassGroupId:n,getConflictingClassGroupIds:o,sortModifiers:i,postfixLookupClassGroupIds:l}=r,s=[],a=e.trim().split(Io);let c="";for(let d=a.length-1;d>=0;d-=1){const u=a[d],{isExternal:h,modifiers:f,hasImportantModifier:m,baseClassName:x,maybePostfixModifierPosition:w}=t(u);if(h){c=u+(c.length>0?" "+c:c);continue}let E=!!w,b;if(E){const P=x.substring(0,w);b=n(P);const p=b&&l[b]?n(x):void 0;p&&p!==b&&(b=p,E=!1)}else b=n(x);if(!b){if(!E){c=u+(c.length>0?" "+c:c);continue}if(b=n(x),!b){c=u+(c.length>0?" "+c:c);continue}E=!1}const k=f.length===0?"":f.length===1?f[0]:i(f).join(":"),_=m?k+Wt:k,v=_+b;if(s.indexOf(v)>-1)continue;s.push(v);const R=o(b,E);for(let P=0;P<R.length;++P){const p=R[P];s.push(_+p)}c=u+(c.length>0?" "+c:c)}return c},Co=(...e)=>{let r=0,t,n,o="";for(;r<e.length;)(t=e[r++])&&(n=Jr(t))&&(o&&(o+=" "),o+=n);return o},Jr=e=>{if(typeof e=="string")return e;let r,t="";for(let n=0;n<e.length;n++)e[n]&&(r=Jr(e[n]))&&(t&&(t+=" "),t+=r);return t},Eo=(e,...r)=>{let t,n,o,i;const l=a=>{const c=r.reduce((d,u)=>u(d),e());return t=zo(c),n=t.cache.get,o=t.cache.set,i=s,s(a)},s=a=>{const c=n(a);if(c)return c;const d=Ao(a,t);return o(a,d),d};return i=l,(...a)=>i(Co(...a))},Mo=[],Q=e=>{const r=t=>t[e]||Mo;return r.isThemeGetter=!0,r.themeKey=e,r},Qr=/^\[(?:(\w[\w-]*):)?(.+)\]$/i,en=/^\((?:(\w[\w-]*):)?(.+)\)$/i,Po=/^\d+(?:\.\d+)?\/\d+(?:\.\d+)?$/,To=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,$o=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,Fo=/^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix|color|light-dark)\(.+\)$/,Ro=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,Lo=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,Se=e=>Po.test(e),j=e=>!!e&&!Number.isNaN(Number(e)),he=e=>!!e&&Number.isInteger(Number(e)),Ft=e=>e.endsWith("%")&&j(e.slice(0,-1)),be=e=>To.test(e),tn=()=>!0,Do=e=>$o.test(e)&&!Fo.test(e),Kt=()=>!1,jo=e=>Ro.test(e),No=e=>Lo.test(e),Go=e=>!O(e)&&!A(e),Wo=e=>e.startsWith("@container")&&(e[10]==="/"&&e[11]!==void 0||e[11]==="s"&&e[16]!==void 0&&e.startsWith("-size/",10)||e[11]==="n"&&e[18]!==void 0&&e.startsWith("-normal/",10)),Bo=e=>ze(e,on,Kt),O=e=>Qr.test(e),Ie=e=>ze(e,sn,Do),fr=e=>ze(e,Zo,j),Vo=e=>ze(e,an,tn),Uo=e=>ze(e,ln,Kt),pr=e=>ze(e,rn,Kt),qo=e=>ze(e,nn,No),ct=e=>ze(e,cn,jo),A=e=>en.test(e),Ze=e=>Pe(e,sn),Ko=e=>Pe(e,ln),hr=e=>Pe(e,rn),Ho=e=>Pe(e,on),Xo=e=>Pe(e,nn),dt=e=>Pe(e,cn,!0),Yo=e=>Pe(e,an,!0),ze=(e,r,t)=>{const n=Qr.exec(e);return n?n[1]?r(n[1]):t(n[2]):!1},Pe=(e,r,t=!1)=>{const n=en.exec(e);return n?n[1]?r(n[1]):t:!1},rn=e=>e==="position"||e==="percentage",nn=e=>e==="image"||e==="url",on=e=>e==="length"||e==="size"||e==="bg-size",sn=e=>e==="length",Zo=e=>e==="number",ln=e=>e==="family-name",an=e=>e==="number"||e==="weight",cn=e=>e==="shadow",Jo=()=>{const e=Q("color"),r=Q("font"),t=Q("text"),n=Q("font-weight"),o=Q("tracking"),i=Q("leading"),l=Q("breakpoint"),s=Q("container"),a=Q("spacing"),c=Q("radius"),d=Q("shadow"),u=Q("inset-shadow"),h=Q("text-shadow"),f=Q("drop-shadow"),m=Q("blur"),x=Q("perspective"),w=Q("aspect"),E=Q("ease"),b=Q("animate"),k=()=>["auto","avoid","all","avoid-page","page","left","right","column"],_=()=>["center","top","bottom","left","right","top-left","left-top","top-right","right-top","bottom-right","right-bottom","bottom-left","left-bottom"],v=()=>[..._(),A,O],R=()=>["auto","hidden","clip","visible","scroll"],P=()=>["auto","contain","none"],p=()=>[A,O,a],y=()=>[Se,"full","auto",...p()],S=()=>[he,"none","subgrid",A,O],g=()=>["auto",{span:["full",he,A,O]},he,A,O],M=()=>[he,"auto",A,O],L=()=>["auto","min","max","fr",A,O],T=()=>["start","end","center","between","around","evenly","stretch","baseline","center-safe","end-safe"],$=()=>["start","end","center","stretch","center-safe","end-safe"],F=()=>["auto",...p()],G=()=>[Se,"auto","full","dvw","dvh","lvw","lvh","svw","svh","min","max","fit",...p()],Y=()=>[s,Se,"screen","full","dvw","lvw","svw","min","max","fit",...p()],ne=()=>[Se,"screen","full","lh","dvh","lvh","svh","min","max","fit",...p()],z=()=>[e,A,O],ie=()=>[..._(),hr,pr,{position:[A,O]}],ge=()=>["no-repeat",{repeat:["","x","y","space","round"]}],He=()=>["auto","cover","contain",Ho,Bo,{size:[A,O]}],B=()=>[Ft,Ze,Ie],W=()=>["","none","full",c,A,O],U=()=>["",j,Ze,Ie],de=()=>["solid","dashed","dotted","double"],J=()=>["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"],q=()=>[j,Ft,hr,pr],Oe=()=>["","none",m,A,O],fe=()=>["none",j,A,O],pe=()=>["none",j,A,O],Te=()=>[j,A,O],st=()=>[Se,"full",...p()];return{cacheSize:500,theme:{animate:["spin","ping","pulse","bounce"],aspect:["video"],blur:[be],breakpoint:[be],color:[tn],container:[be],"drop-shadow":[be],ease:["in","out","in-out"],font:[Go],"font-weight":["thin","extralight","light","normal","medium","semibold","bold","extrabold","black"],"inset-shadow":[be],leading:["none","tight","snug","normal","relaxed","loose"],perspective:["dramatic","near","normal","midrange","distant","none"],radius:[be],shadow:[be],spacing:["px",j],text:[be],"text-shadow":[be],tracking:["tighter","tight","normal","wide","wider","widest"]},classGroups:{aspect:[{aspect:["auto","square",Se,O,A,w]}],container:["container"],"container-type":[{"@container":["","normal","size",A,O]}],"container-named":[Wo],columns:[{columns:[j,"auto",O,A,s]}],"break-after":[{"break-after":k()}],"break-before":[{"break-before":k()}],"break-inside":[{"break-inside":["auto","avoid","avoid-page","avoid-column"]}],"box-decoration":[{"box-decoration":["slice","clone"]}],box:[{box:["border","content"]}],display:["block","inline-block","inline","flex","inline-flex","table","inline-table","table-caption","table-cell","table-column","table-column-group","table-footer-group","table-header-group","table-row-group","table-row","flow-root","grid","inline-grid","contents","list-item","hidden"],sr:["sr-only","not-sr-only"],float:[{float:["right","left","none","start","end"]}],clear:[{clear:["left","right","both","none","start","end"]}],isolation:["isolate","isolation-auto"],"object-fit":[{object:["contain","cover","fill","none","scale-down"]}],"object-position":[{object:v()}],overflow:[{overflow:R()}],"overflow-x":[{"overflow-x":R()}],"overflow-y":[{"overflow-y":R()}],overscroll:[{overscroll:P()}],"overscroll-x":[{"overscroll-x":P()}],"overscroll-y":[{"overscroll-y":P()}],position:["static","fixed","absolute","relative","sticky"],inset:[{inset:y()}],"inset-x":[{"inset-x":y()}],"inset-y":[{"inset-y":y()}],start:[{"inset-s":y(),start:y()}],end:[{"inset-e":y(),end:y()}],"inset-bs":[{"inset-bs":y()}],"inset-be":[{"inset-be":y()}],top:[{top:y()}],right:[{right:y()}],bottom:[{bottom:y()}],left:[{left:y()}],visibility:["visible","invisible","collapse"],z:[{z:[he,"auto",A,O]}],basis:[{basis:[Se,"full","auto",s,...p()]}],"flex-direction":[{flex:["row","row-reverse","col","col-reverse"]}],"flex-wrap":[{flex:["nowrap","wrap","wrap-reverse"]}],flex:[{flex:[j,Se,"auto","initial","none",O]}],grow:[{grow:["",j,A,O]}],shrink:[{shrink:["",j,A,O]}],order:[{order:[he,"first","last","none",A,O]}],"grid-cols":[{"grid-cols":S()}],"col-start-end":[{col:g()}],"col-start":[{"col-start":M()}],"col-end":[{"col-end":M()}],"grid-rows":[{"grid-rows":S()}],"row-start-end":[{row:g()}],"row-start":[{"row-start":M()}],"row-end":[{"row-end":M()}],"grid-flow":[{"grid-flow":["row","col","dense","row-dense","col-dense"]}],"auto-cols":[{"auto-cols":L()}],"auto-rows":[{"auto-rows":L()}],gap:[{gap:p()}],"gap-x":[{"gap-x":p()}],"gap-y":[{"gap-y":p()}],"justify-content":[{justify:[...T(),"normal"]}],"justify-items":[{"justify-items":[...$(),"normal"]}],"justify-self":[{"justify-self":["auto",...$()]}],"align-content":[{content:["normal",...T()]}],"align-items":[{items:[...$(),{baseline:["","last"]}]}],"align-self":[{self:["auto",...$(),{baseline:["","last"]}]}],"place-content":[{"place-content":T()}],"place-items":[{"place-items":[...$(),"baseline"]}],"place-self":[{"place-self":["auto",...$()]}],p:[{p:p()}],px:[{px:p()}],py:[{py:p()}],ps:[{ps:p()}],pe:[{pe:p()}],pbs:[{pbs:p()}],pbe:[{pbe:p()}],pt:[{pt:p()}],pr:[{pr:p()}],pb:[{pb:p()}],pl:[{pl:p()}],m:[{m:F()}],mx:[{mx:F()}],my:[{my:F()}],ms:[{ms:F()}],me:[{me:F()}],mbs:[{mbs:F()}],mbe:[{mbe:F()}],mt:[{mt:F()}],mr:[{mr:F()}],mb:[{mb:F()}],ml:[{ml:F()}],"space-x":[{"space-x":p()}],"space-x-reverse":["space-x-reverse"],"space-y":[{"space-y":p()}],"space-y-reverse":["space-y-reverse"],size:[{size:G()}],"inline-size":[{inline:["auto",...Y()]}],"min-inline-size":[{"min-inline":["auto",...Y()]}],"max-inline-size":[{"max-inline":["none",...Y()]}],"block-size":[{block:["auto",...ne()]}],"min-block-size":[{"min-block":["auto",...ne()]}],"max-block-size":[{"max-block":["none",...ne()]}],w:[{w:[s,"screen",...G()]}],"min-w":[{"min-w":[s,"screen","none",...G()]}],"max-w":[{"max-w":[s,"screen","none","prose",{screen:[l]},...G()]}],h:[{h:["screen","lh",...G()]}],"min-h":[{"min-h":["screen","lh","none",...G()]}],"max-h":[{"max-h":["screen","lh","none",...G()]}],"font-size":[{text:["base",t,Ze,Ie]}],"font-smoothing":["antialiased","subpixel-antialiased"],"font-style":["italic","not-italic"],"font-weight":[{font:[n,Yo,Vo]}],"font-stretch":[{"font-stretch":["ultra-condensed","extra-condensed","condensed","semi-condensed","normal","semi-expanded","expanded","extra-expanded","ultra-expanded",Ft,O]}],"font-family":[{font:[Ko,Uo,r]}],"font-features":[{"font-features":[O]}],"fvn-normal":["normal-nums"],"fvn-ordinal":["ordinal"],"fvn-slashed-zero":["slashed-zero"],"fvn-figure":["lining-nums","oldstyle-nums"],"fvn-spacing":["proportional-nums","tabular-nums"],"fvn-fraction":["diagonal-fractions","stacked-fractions"],tracking:[{tracking:[o,A,O]}],"line-clamp":[{"line-clamp":[j,"none",A,fr]}],leading:[{leading:["none",i,...p()]}],"list-image":[{"list-image":["none",A,O]}],"list-style-position":[{list:["inside","outside"]}],"list-style-type":[{list:["disc","decimal","none",A,O]}],"text-alignment":[{text:["left","center","right","justify","start","end"]}],"placeholder-color":[{placeholder:z()}],"text-color":[{text:z()}],"text-decoration":["underline","overline","line-through","no-underline"],"text-decoration-style":[{decoration:[...de(),"wavy"]}],"text-decoration-thickness":[{decoration:[j,"from-font","auto",A,Ie]}],"text-decoration-color":[{decoration:z()}],"underline-offset":[{"underline-offset":[j,"auto",A,O]}],"text-transform":["uppercase","lowercase","capitalize","normal-case"],"text-overflow":["truncate","text-ellipsis","text-clip"],"text-wrap":[{text:["wrap","nowrap","balance","pretty"]}],indent:[{indent:p()}],"tab-size":[{tab:[he,A,O]}],"vertical-align":[{align:["baseline","top","middle","bottom","text-top","text-bottom","sub","super",A,O]}],whitespace:[{whitespace:["normal","nowrap","pre","pre-line","pre-wrap","break-spaces"]}],break:[{break:["normal","words","all","keep"]}],wrap:[{wrap:["break-word","anywhere","normal"]}],hyphens:[{hyphens:["none","manual","auto"]}],content:[{content:["none",A,O]}],"bg-attachment":[{bg:["fixed","local","scroll"]}],"bg-clip":[{"bg-clip":["border","padding","content","text"]}],"bg-origin":[{"bg-origin":["border","padding","content"]}],"bg-position":[{bg:ie()}],"bg-repeat":[{bg:ge()}],"bg-size":[{bg:He()}],"bg-image":[{bg:["none",{linear:[{to:["t","tr","r","br","b","bl","l","tl"]},he,A,O],radial:["",A,O],conic:["",he,A,O]},Xo,qo]}],"bg-color":[{bg:z()}],"gradient-from-pos":[{from:B()}],"gradient-via-pos":[{via:B()}],"gradient-to-pos":[{to:B()}],"gradient-from":[{from:z()}],"gradient-via":[{via:z()}],"gradient-to":[{to:z()}],rounded:[{rounded:W()}],"rounded-s":[{"rounded-s":W()}],"rounded-e":[{"rounded-e":W()}],"rounded-t":[{"rounded-t":W()}],"rounded-r":[{"rounded-r":W()}],"rounded-b":[{"rounded-b":W()}],"rounded-l":[{"rounded-l":W()}],"rounded-ss":[{"rounded-ss":W()}],"rounded-se":[{"rounded-se":W()}],"rounded-ee":[{"rounded-ee":W()}],"rounded-es":[{"rounded-es":W()}],"rounded-tl":[{"rounded-tl":W()}],"rounded-tr":[{"rounded-tr":W()}],"rounded-br":[{"rounded-br":W()}],"rounded-bl":[{"rounded-bl":W()}],"border-w":[{border:U()}],"border-w-x":[{"border-x":U()}],"border-w-y":[{"border-y":U()}],"border-w-s":[{"border-s":U()}],"border-w-e":[{"border-e":U()}],"border-w-bs":[{"border-bs":U()}],"border-w-be":[{"border-be":U()}],"border-w-t":[{"border-t":U()}],"border-w-r":[{"border-r":U()}],"border-w-b":[{"border-b":U()}],"border-w-l":[{"border-l":U()}],"divide-x":[{"divide-x":U()}],"divide-x-reverse":["divide-x-reverse"],"divide-y":[{"divide-y":U()}],"divide-y-reverse":["divide-y-reverse"],"border-style":[{border:[...de(),"hidden","none"]}],"divide-style":[{divide:[...de(),"hidden","none"]}],"border-color":[{border:z()}],"border-color-x":[{"border-x":z()}],"border-color-y":[{"border-y":z()}],"border-color-s":[{"border-s":z()}],"border-color-e":[{"border-e":z()}],"border-color-bs":[{"border-bs":z()}],"border-color-be":[{"border-be":z()}],"border-color-t":[{"border-t":z()}],"border-color-r":[{"border-r":z()}],"border-color-b":[{"border-b":z()}],"border-color-l":[{"border-l":z()}],"divide-color":[{divide:z()}],"outline-style":[{outline:[...de(),"none","hidden"]}],"outline-offset":[{"outline-offset":[j,A,O]}],"outline-w":[{outline:["",j,Ze,Ie]}],"outline-color":[{outline:z()}],shadow:[{shadow:["","inner","none",d,dt,ct]}],"shadow-color":[{shadow:z()}],"inset-shadow":[{"inset-shadow":["none",u,dt,ct]}],"inset-shadow-color":[{"inset-shadow":z()}],"ring-w":[{ring:U()}],"ring-w-inset":["ring-inset"],"ring-color":[{ring:z()}],"ring-offset-w":[{"ring-offset":[j,Ie]}],"ring-offset-color":[{"ring-offset":z()}],"inset-ring-w":[{"inset-ring":U()}],"inset-ring-color":[{"inset-ring":z()}],"text-shadow":[{"text-shadow":["none",h,dt,ct]}],"text-shadow-color":[{"text-shadow":z()}],opacity:[{opacity:[j,A,O]}],"mix-blend":[{"mix-blend":[...J(),"plus-darker","plus-lighter"]}],"bg-blend":[{"bg-blend":J()}],"mask-clip":[{"mask-clip":["border","padding","content","fill","stroke","view"]},"mask-no-clip"],"mask-composite":[{mask:["add","subtract","intersect","exclude"]}],"mask-image-linear-pos":[{"mask-linear":[j]}],"mask-image-linear-from-pos":[{"mask-linear-from":q()}],"mask-image-linear-to-pos":[{"mask-linear-to":q()}],"mask-image-linear-from-color":[{"mask-linear-from":z()}],"mask-image-linear-to-color":[{"mask-linear-to":z()}],"mask-image-t-from-pos":[{"mask-t-from":q()}],"mask-image-t-to-pos":[{"mask-t-to":q()}],"mask-image-t-from-color":[{"mask-t-from":z()}],"mask-image-t-to-color":[{"mask-t-to":z()}],"mask-image-r-from-pos":[{"mask-r-from":q()}],"mask-image-r-to-pos":[{"mask-r-to":q()}],"mask-image-r-from-color":[{"mask-r-from":z()}],"mask-image-r-to-color":[{"mask-r-to":z()}],"mask-image-b-from-pos":[{"mask-b-from":q()}],"mask-image-b-to-pos":[{"mask-b-to":q()}],"mask-image-b-from-color":[{"mask-b-from":z()}],"mask-image-b-to-color":[{"mask-b-to":z()}],"mask-image-l-from-pos":[{"mask-l-from":q()}],"mask-image-l-to-pos":[{"mask-l-to":q()}],"mask-image-l-from-color":[{"mask-l-from":z()}],"mask-image-l-to-color":[{"mask-l-to":z()}],"mask-image-x-from-pos":[{"mask-x-from":q()}],"mask-image-x-to-pos":[{"mask-x-to":q()}],"mask-image-x-from-color":[{"mask-x-from":z()}],"mask-image-x-to-color":[{"mask-x-to":z()}],"mask-image-y-from-pos":[{"mask-y-from":q()}],"mask-image-y-to-pos":[{"mask-y-to":q()}],"mask-image-y-from-color":[{"mask-y-from":z()}],"mask-image-y-to-color":[{"mask-y-to":z()}],"mask-image-radial":[{"mask-radial":[A,O]}],"mask-image-radial-from-pos":[{"mask-radial-from":q()}],"mask-image-radial-to-pos":[{"mask-radial-to":q()}],"mask-image-radial-from-color":[{"mask-radial-from":z()}],"mask-image-radial-to-color":[{"mask-radial-to":z()}],"mask-image-radial-shape":[{"mask-radial":["circle","ellipse"]}],"mask-image-radial-size":[{"mask-radial":[{closest:["side","corner"],farthest:["side","corner"]}]}],"mask-image-radial-pos":[{"mask-radial-at":_()}],"mask-image-conic-pos":[{"mask-conic":[j]}],"mask-image-conic-from-pos":[{"mask-conic-from":q()}],"mask-image-conic-to-pos":[{"mask-conic-to":q()}],"mask-image-conic-from-color":[{"mask-conic-from":z()}],"mask-image-conic-to-color":[{"mask-conic-to":z()}],"mask-mode":[{mask:["alpha","luminance","match"]}],"mask-origin":[{"mask-origin":["border","padding","content","fill","stroke","view"]}],"mask-position":[{mask:ie()}],"mask-repeat":[{mask:ge()}],"mask-size":[{mask:He()}],"mask-type":[{"mask-type":["alpha","luminance"]}],"mask-image":[{mask:["none",A,O]}],filter:[{filter:["","none",A,O]}],blur:[{blur:Oe()}],brightness:[{brightness:[j,A,O]}],contrast:[{contrast:[j,A,O]}],"drop-shadow":[{"drop-shadow":["","none",f,dt,ct]}],"drop-shadow-color":[{"drop-shadow":z()}],grayscale:[{grayscale:["",j,A,O]}],"hue-rotate":[{"hue-rotate":[j,A,O]}],invert:[{invert:["",j,A,O]}],saturate:[{saturate:[j,A,O]}],sepia:[{sepia:["",j,A,O]}],"backdrop-filter":[{"backdrop-filter":["","none",A,O]}],"backdrop-blur":[{"backdrop-blur":Oe()}],"backdrop-brightness":[{"backdrop-brightness":[j,A,O]}],"backdrop-contrast":[{"backdrop-contrast":[j,A,O]}],"backdrop-grayscale":[{"backdrop-grayscale":["",j,A,O]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[j,A,O]}],"backdrop-invert":[{"backdrop-invert":["",j,A,O]}],"backdrop-opacity":[{"backdrop-opacity":[j,A,O]}],"backdrop-saturate":[{"backdrop-saturate":[j,A,O]}],"backdrop-sepia":[{"backdrop-sepia":["",j,A,O]}],"border-collapse":[{border:["collapse","separate"]}],"border-spacing":[{"border-spacing":p()}],"border-spacing-x":[{"border-spacing-x":p()}],"border-spacing-y":[{"border-spacing-y":p()}],"table-layout":[{table:["auto","fixed"]}],caption:[{caption:["top","bottom"]}],transition:[{transition:["","all","colors","opacity","shadow","transform","none",A,O]}],"transition-behavior":[{transition:["normal","discrete"]}],duration:[{duration:[j,"initial",A,O]}],ease:[{ease:["linear","initial",E,A,O]}],delay:[{delay:[j,A,O]}],animate:[{animate:["none",b,A,O]}],backface:[{backface:["hidden","visible"]}],perspective:[{perspective:[x,A,O]}],"perspective-origin":[{"perspective-origin":v()}],rotate:[{rotate:fe()}],"rotate-x":[{"rotate-x":fe()}],"rotate-y":[{"rotate-y":fe()}],"rotate-z":[{"rotate-z":fe()}],scale:[{scale:pe()}],"scale-x":[{"scale-x":pe()}],"scale-y":[{"scale-y":pe()}],"scale-z":[{"scale-z":pe()}],"scale-3d":["scale-3d"],skew:[{skew:Te()}],"skew-x":[{"skew-x":Te()}],"skew-y":[{"skew-y":Te()}],transform:[{transform:[A,O,"","none","gpu","cpu"]}],"transform-origin":[{origin:v()}],"transform-style":[{transform:["3d","flat"]}],translate:[{translate:st()}],"translate-x":[{"translate-x":st()}],"translate-y":[{"translate-y":st()}],"translate-z":[{"translate-z":st()}],"translate-none":["translate-none"],zoom:[{zoom:[he,A,O]}],accent:[{accent:z()}],appearance:[{appearance:["none","auto"]}],"caret-color":[{caret:z()}],"color-scheme":[{scheme:["normal","dark","light","light-dark","only-dark","only-light"]}],cursor:[{cursor:["auto","default","pointer","wait","text","move","help","not-allowed","none","context-menu","progress","cell","crosshair","vertical-text","alias","copy","no-drop","grab","grabbing","all-scroll","col-resize","row-resize","n-resize","e-resize","s-resize","w-resize","ne-resize","nw-resize","se-resize","sw-resize","ew-resize","ns-resize","nesw-resize","nwse-resize","zoom-in","zoom-out",A,O]}],"field-sizing":[{"field-sizing":["fixed","content"]}],"pointer-events":[{"pointer-events":["auto","none"]}],resize:[{resize:["none","","y","x"]}],"scroll-behavior":[{scroll:["auto","smooth"]}],"scrollbar-thumb-color":[{"scrollbar-thumb":z()}],"scrollbar-track-color":[{"scrollbar-track":z()}],"scrollbar-gutter":[{"scrollbar-gutter":["auto","stable","both"]}],"scrollbar-w":[{scrollbar:["auto","thin","none"]}],"scroll-m":[{"scroll-m":p()}],"scroll-mx":[{"scroll-mx":p()}],"scroll-my":[{"scroll-my":p()}],"scroll-ms":[{"scroll-ms":p()}],"scroll-me":[{"scroll-me":p()}],"scroll-mbs":[{"scroll-mbs":p()}],"scroll-mbe":[{"scroll-mbe":p()}],"scroll-mt":[{"scroll-mt":p()}],"scroll-mr":[{"scroll-mr":p()}],"scroll-mb":[{"scroll-mb":p()}],"scroll-ml":[{"scroll-ml":p()}],"scroll-p":[{"scroll-p":p()}],"scroll-px":[{"scroll-px":p()}],"scroll-py":[{"scroll-py":p()}],"scroll-ps":[{"scroll-ps":p()}],"scroll-pe":[{"scroll-pe":p()}],"scroll-pbs":[{"scroll-pbs":p()}],"scroll-pbe":[{"scroll-pbe":p()}],"scroll-pt":[{"scroll-pt":p()}],"scroll-pr":[{"scroll-pr":p()}],"scroll-pb":[{"scroll-pb":p()}],"scroll-pl":[{"scroll-pl":p()}],"snap-align":[{snap:["start","end","center","align-none"]}],"snap-stop":[{snap:["normal","always"]}],"snap-type":[{snap:["none","x","y","both"]}],"snap-strictness":[{snap:["mandatory","proximity"]}],touch:[{touch:["auto","none","manipulation"]}],"touch-x":[{"touch-pan":["x","left","right"]}],"touch-y":[{"touch-pan":["y","up","down"]}],"touch-pz":["touch-pinch-zoom"],select:[{select:["none","text","all","auto"]}],"will-change":[{"will-change":["auto","scroll","contents","transform",A,O]}],fill:[{fill:["none",...z()]}],"stroke-w":[{stroke:[j,Ze,Ie,fr]}],stroke:[{stroke:["none",...z()]}],"forced-color-adjust":[{"forced-color-adjust":["auto","none"]}]},conflictingClassGroups:{"container-named":["container-type"],overflow:["overflow-x","overflow-y"],overscroll:["overscroll-x","overscroll-y"],inset:["inset-x","inset-y","inset-bs","inset-be","start","end","top","right","bottom","left"],"inset-x":["start","end","right","left"],"inset-y":["inset-bs","inset-be","top","bottom"],flex:["basis","grow","shrink"],gap:["gap-x","gap-y"],p:["px","py","ps","pe","pbs","pbe","pt","pr","pb","pl"],px:["ps","pe","pr","pl"],py:["pbs","pbe","pt","pb"],m:["mx","my","ms","me","mbs","mbe","mt","mr","mb","ml"],mx:["ms","me","mr","ml"],my:["mbs","mbe","mt","mb"],size:["w","h"],"font-size":["leading"],"fvn-normal":["fvn-ordinal","fvn-slashed-zero","fvn-figure","fvn-spacing","fvn-fraction"],"fvn-ordinal":["fvn-normal"],"fvn-slashed-zero":["fvn-normal"],"fvn-figure":["fvn-normal"],"fvn-spacing":["fvn-normal"],"fvn-fraction":["fvn-normal"],"line-clamp":["display","overflow"],rounded:["rounded-s","rounded-e","rounded-t","rounded-r","rounded-b","rounded-l","rounded-ss","rounded-se","rounded-ee","rounded-es","rounded-tl","rounded-tr","rounded-br","rounded-bl"],"rounded-s":["rounded-ss","rounded-es"],"rounded-e":["rounded-se","rounded-ee"],"rounded-t":["rounded-tl","rounded-tr"],"rounded-r":["rounded-tr","rounded-br"],"rounded-b":["rounded-br","rounded-bl"],"rounded-l":["rounded-tl","rounded-bl"],"border-spacing":["border-spacing-x","border-spacing-y"],"border-w":["border-w-x","border-w-y","border-w-s","border-w-e","border-w-bs","border-w-be","border-w-t","border-w-r","border-w-b","border-w-l"],"border-w-x":["border-w-s","border-w-e","border-w-r","border-w-l"],"border-w-y":["border-w-bs","border-w-be","border-w-t","border-w-b"],"border-color":["border-color-x","border-color-y","border-color-s","border-color-e","border-color-bs","border-color-be","border-color-t","border-color-r","border-color-b","border-color-l"],"border-color-x":["border-color-s","border-color-e","border-color-r","border-color-l"],"border-color-y":["border-color-bs","border-color-be","border-color-t","border-color-b"],translate:["translate-x","translate-y","translate-none"],"translate-none":["translate","translate-x","translate-y","translate-z"],"scroll-m":["scroll-mx","scroll-my","scroll-ms","scroll-me","scroll-mbs","scroll-mbe","scroll-mt","scroll-mr","scroll-mb","scroll-ml"],"scroll-mx":["scroll-ms","scroll-me","scroll-mr","scroll-ml"],"scroll-my":["scroll-mbs","scroll-mbe","scroll-mt","scroll-mb"],"scroll-p":["scroll-px","scroll-py","scroll-ps","scroll-pe","scroll-pbs","scroll-pbe","scroll-pt","scroll-pr","scroll-pb","scroll-pl"],"scroll-px":["scroll-ps","scroll-pe","scroll-pr","scroll-pl"],"scroll-py":["scroll-pbs","scroll-pbe","scroll-pt","scroll-pb"],touch:["touch-x","touch-y","touch-pz"],"touch-x":["touch"],"touch-y":["touch"],"touch-pz":["touch"]},conflictingClassGroupModifiers:{"font-size":["leading"]},postfixLookupClassGroups:["container-type"],orderSensitiveModifiers:["*","**","after","backdrop","before","details-content","file","first-letter","first-line","marker","placeholder","selection"]}},Qo=Eo(Jo),oe=(...e)=>Qo(Pt(e));var ei=D("<button>");const Ht=e=>{const[r,t]=At(e,["class"]);return(()=>{var n=ei();return Ct(n,Ce({get class(){return oe("flex min-w-0 cursor-pointer items-center justify-center rounded border text-center disabled:cursor-default disabled:opacity-50",r.class)}},t),!1,!1),n})()};function ti(e){return typeof e=="object"?e.key:e}function ri(e,r){const t=e.length;return new Proxy(e,{get(n,o,i){if(typeof o=="string"){const l=o.charCodeAt(0);if(l>=48&&l<=57){const s=+o;if(Number.isInteger(s)&&s>=0&&s<t){let a=n[s];if(typeof a!="object"){const c=r[s*2];a=n[s]={index:s,key:a,start:c,size:r[s*2+1],end:c+r[s*2+1],lane:0}}return a}}if(o==="length")return t}return Reflect.get(n,o,i)}})}function Fe(e,r,t){let n=t.initialDeps??[],o,i=!0;function l(){const s=e();return(s.length!==n.length||s.some((c,d)=>n[d]!==c))&&(n=s,o=r(...s),t!=null&&t.onChange&&!(i&&t.skipInitialOnChange)&&t.onChange(o),i=!1),o}return l.updateDeps=s=>{n=s},l}function mr(e,r){if(e===void 0)throw new Error("Unexpected undefined");return e}const Ae=(e,r)=>Math.abs(e-r)<1.01,ni=(e,r,t)=>{let n;return Object.assign(function(...o){e.clearTimeout(n),n=e.setTimeout(()=>r.apply(this,o),t)},{cancel:()=>{e.clearTimeout(n)}})};function oi({offset:e,isScrolling:r,elementMax:t,holdOffset:n,scrollOffset:o,pendingWrite:i,clampedMaxAtWrite:l}){var s;return r&&i===null&&e===o?"spurious":i!==null&&Math.abs(e-i.target)<1.5?"readBack":i!==null&&!i.smooth&&t!==null&&i.target>t+n+.5&&Math.abs(e-(t+n))<1.5||i!==null&&!i.smooth&&((s=i.lowMaxes)!=null&&s.some(a=>Math.abs(e-a)<1.5))?"clampedReadBack":l!==null&&Math.abs(e-l)<1.5?"clampedEcho":"external"}const ii=e=>e==="smooth"||e==="smoothFinishing";function si({kind:e,offset:r,command:t,target:n}){return e!=="spurious"&&e!=="readBack"&&e!=="clampedReadBack"&&(t==null?void 0:t.index)!=null&&t.phase!=="queued"&&!ii(t.phase)&&!Ae(r,t.lastTargetOffset)&&!Ae(r,n())&&e!=="clampedEcho"}const Bt=40;function li(e){const r=e[e.length-1];if(r===void 0)return!1;let t=e.length-2;for(;t>=0&&r.t-e[t].t<Bt;)t--;if(t<0)return!1;const n=e[t];let o=t-1;for(;o>=0&&n.t-e[o].t<Bt;)o--;if(o<0)return!1;const i=e[o],l=(r.offset-n.offset)/(r.t-n.t),s=(n.offset-i.offset)/(n.t-i.t);return l*s>=0&&Math.abs(l)>=2*Math.abs(s)&&Math.abs(l)-Math.abs(s)>=.8}function ai(e){const r=e[e.length-1];if(r===void 0)return!1;let t=e.length-2;for(;t>=0&&r.t-e[t].t<Bt;)t--;if(t<0)return!1;const n=e[t];return Math.abs(r.offset-n.offset)/(r.t-n.t)>=.05}let Je;const St=()=>{if(Je!==void 0)return Je;if(typeof navigator>"u")return Je=!1;if(/iP(hone|od|ad)/.test(navigator.userAgent))return Je=!0;const e=navigator.maxTouchPoints;return Je=navigator.platform==="MacIntel"&&e!==void 0&&e>0};let Rt;const ci=()=>Rt!==void 0?Rt:Rt=St()&&typeof CSS<"u"&&typeof CSS.supports=="function"&&CSS.supports("overflow-anchor: auto"),di=()=>!St()||ci(),Re={capture:!0,passive:!0};class ui{constructor(r){this.host=r,this._touch=null,this.inMotion=()=>this._touch!==null&&this._touch.phase!=="lateFling",this.dragging=()=>{var t;return((t=this._touch)==null?void 0:t.phase)==="down"&&this._touch.moved},this.tail=()=>{var t;return((t=this._touch)==null?void 0:t.phase)==="tail"?this._touch.moved?"fling":"tap":null},this.onScroll=({isScrolling:t,ownReadBack:n,moved:o,external:i})=>{var l,s,a;return t&&((l=this._touch)==null?void 0:l.phase)==="tail"?this._openTail(this._touch.moved||!n,!1):((s=this._touch)==null?void 0:s.phase)==="lateFling"&&(this.host.now()>this._touch.until?this._touch=null:i&&t&&o&&this._openTail(!0,!1)),!n&&t&&o&&((a=this._touch)==null?void 0:a.phase)==="down"?(this._touch.moved=!0,!0):!1},this.touchStart=()=>{this.end(),this._touch={phase:"down",moved:!1}},this.touchEnd=()=>{var t;const n=((t=this._touch)==null?void 0:t.phase)==="down"&&this._touch.moved;this.end(),this._openTail(n,n)},this.end=()=>{var t;const n=this.host.getWindow();((t=this._touch)==null?void 0:t.phase)==="tail"&&n!=null&&n.clearTimeout(this._touch.timerId),this._touch=null},this.listen=t=>{const n=()=>this.touchStart(),o=()=>this.touchEnd();return t.addEventListener("touchstart",n,Re),t.addEventListener("touchend",o,Re),t.addEventListener("touchcancel",o,Re),()=>{t.removeEventListener("touchstart",n,Re),t.removeEventListener("touchend",o,Re),t.removeEventListener("touchcancel",o,Re),this.end()}},this._openTail=(t,n)=>{const o=this.host.getWindow();if(o==null)return;this.end();const i={phase:"tail",moved:t,awaitingFling:n,timerId:o.setTimeout(()=>{if(this.host.tailStillMoving()){this._openTail(i.moved,i.awaitingFling);return}this._touch=i.awaitingFling?{phase:"lateFling",until:this.host.now()+1e3}:null,this.host.onTailClosed()},150)};this._touch=i}}get touch(){return this._touch}}const gr=e=>{const{clientWidth:r,clientHeight:t}=e;return{width:r,height:t}},dn=e=>{const r=new Set;return{schedule:t=>{const n=e.requestAnimationFrame(()=>{r.delete(n),t()});r.add(n)},cancel:()=>{r.forEach(t=>e.cancelAnimationFrame(t)),r.clear()}}},fi=e=>e,pi=e=>{const r=e.overscan*Math.max(e.lanes??1,1),t=Math.max(e.startIndex-r,0),o=Math.min(e.endIndex+r,e.count-1)-t+1,i=new Array(o);for(let l=0;l<o;l++)i[l]=t+l;return i},hi=(e,r)=>{const t=e.scrollElement;if(!t)return;const n=e.targetWindow;if(!n)return;const o=s=>{const{width:a,height:c}=s;r({width:Math.round(a),height:Math.round(c)})};if(o(gr(t)),!n.ResizeObserver)return()=>{};const i=dn(n),l=new n.ResizeObserver(()=>{const s=()=>{o(gr(t))};e.options.useAnimationFrameWithResizeObserver?i.schedule(s):s()});return l.observe(t,{box:"content-box"}),()=>{l.unobserve(t),i.cancel()}},br={passive:!0},mi=typeof window>"u"?!0:"onscrollend"in window,gi=(e,r,t)=>{const n=e.scrollElement;if(!n)return;const o=e.targetWindow;if(!o)return;const i=e.options.useScrollendEvent&&mi;let l=0;const s=i?null:ni(o,()=>r(t(n),!1),e.options.isScrollingResetDelay),a=u=>()=>{l=t(n),s==null||s(),r(l,u)},c=a(!0),d=a(!1);return n.addEventListener("scroll",c,br),i&&n.addEventListener("scrollend",d,br),()=>{n.removeEventListener("scroll",c),i&&n.removeEventListener("scrollend",d),s==null||s.cancel()}},bi=(e,r)=>gi(e,r,t=>{const{horizontal:n,isRtl:o}=e.options;return n?t.scrollLeft*(o&&-1||1):t.scrollTop}),xi=(e,r,t)=>{if(t.options.useCachedMeasurements){const n=t.indexFromElement(e),o=t.options.getItemKey(n);return t.itemSizeCache.get(o)??t.options.estimateSize(n)}if(r!=null&&r.borderBoxSize){const n=r.borderBoxSize[0];if(n)return Math.round(n[t.options.horizontal?"inlineSize":"blockSize"])}if(!r){const n=t.indexFromElement(e),o=t.options.getItemKey(n),i=t.itemSizeCache.get(o);if(i!==void 0)return i}return e[t.options.horizontal?"offsetWidth":"offsetHeight"]},yi=(e,{adjustments:r=0,behavior:t},n)=>{var o;const{scrollElement:i,options:l}=n,s=e+r,a=l.horizontal&&l.isRtl&&i!==null&&"ownerDocument"in i;(o=i==null?void 0:i.scrollTo)==null||o.call(i,{[l.horizontal?"left":"top"]:a?-s:s,behavior:t})},vi=yi,xr=(e,r)=>e==="smooth"?r?"smoothLanded":"smooth":"instant",Qe=e=>(e==null?void 0:e.phase)==="smooth"||(e==null?void 0:e.phase)==="smoothLanded";function wi(e,r,t,n){if(r===0)return!1;const o=n(0),i=new Set;let l=0;for(;l<e;){const a=t(l);if(a===o)break;i.add(a),l++}const s=e-l;if(s===0||s>=r)return!1;for(let a=0;a<s;a++)if(n(a)!==t(l+a))return!1;for(let a=s;a<r;a++)if(i.has(n(a)))return!1;return!0}class ki{constructor(r){this.unsubs=[],this.scrollElement=null,this.targetWindow=null,this.isScrolling=!1,this.scrollState=null,this.measurementsCache=[],this._singleLaneMeasurements=null,this.itemSizeCache=new Map,this.itemSizeCacheVersion=0,this.laneAssignments=new Map,this.pendingMin=null,this.prevLanes=void 0,this.lanesChangedFlag=!1,this.lanesSettling=!1,this.pendingScrollAnchor=null,this.scrollRect=null,this.scrollOffset=null,this.scrollDirection=null,this._holdOffset=0,this._reportedOverscroll=!1,this._iosGesture=new ui({getWindow:()=>this.targetWindow,now:()=>this.now(),tailStillMoving:()=>{const t=this.scrollState;if((t==null?void 0:t.phase)!=="queued"||this.pendingWrite!==null)return!1;const n=this._readElementOffset();return n===null||this._lastElementOffset===null||Math.abs(n-this._lastElementOffset)<1?!1:(this._lastElementOffset=n,t.samples=[...t.samples??[],{t:this.now(),offset:n}],!0)},onTailClosed:()=>{const t=this.scrollState;(t==null?void 0:t.phase)==="queued"&&ai(t.samples??[])&&(this.scrollState=null),this._flushHoldIfReady(!0),this._writeAwaitingCommand(),this._retryClampedAdjustment()}}),this._lastElementOffset=null,this.pendingWrite=null,this._clampedAdjustment=null,this.elementsCache=new Map,this._resizeBatch=null,this.now=()=>{var t,n,o;return((o=(n=(t=this.targetWindow)==null?void 0:t.performance)==null?void 0:n.now)==null?void 0:o.call(n))??Date.now()},this.observer=(()=>{let t=null,n=null,o=!1,i=!1;const l=new Set,s=()=>{if(t)return t;const c=this.targetWindow;if(!c||!c.ResizeObserver)return null;const d=n=dn(c);return t=new c.ResizeObserver(u=>{const h=()=>{const f={sync:!1};this._resizeBatch=f;try{u.forEach(a)}finally{this._resizeBatch=null,f.notify&&(this.notify(f.sync),this._noteClampMax(),this._flushHoldIfReady(!0),this._retryClampedAdjustment(),this.measureElement(null))}};if(this.options.useAnimationFrameWithResizeObserver)d.schedule(h);else{o=!0;try{h()}finally{o=!1}}})},a=c=>{const d=c.target,u=this.indexFromElement(d);if(!d.isConnected){this.observer.unobserve(d);for(const[h,f]of this.elementsCache)if(f===d){this.elementsCache.delete(h);break}return}this.isIndexInRange(u)&&this.shouldMeasureDuringScroll(u)&&this.resizeItem(u,this.options.measureElement(d,c,this))};return{disconnect:()=>{var c;(c=s())==null||c.disconnect(),n==null||n.cancel(),l.clear(),i=!1,t=null,n=null},observe:c=>{const d=s();if(d){if(!o){d.observe(c,{box:"border-box"});return}l.add(c),i||(i=!0,n==null||n.schedule(()=>{i=!1,l.forEach(u=>{u.isConnected&&(t==null||t.observe(u,{box:"border-box"}))}),l.clear()}))}},unobserve:c=>{var d;l.delete(c),(d=s())==null||d.unobserve(c)}}})(),this.range=null,this.setOptions=t=>{var n;const o={debug:!1,initialOffset:0,overscan:1,paddingStart:0,paddingEnd:0,scrollPaddingStart:0,scrollPaddingEnd:0,horizontal:!1,getItemKey:fi,rangeExtractor:pi,onChange:()=>{},measureElement:xi,initialRect:{width:0,height:0},scrollMargin:0,gap:0,indexAttribute:"data-index",initialMeasurementsCache:[],lanes:1,anchorTo:"start",followOnAppend:!1,scrollEndThreshold:1,isScrollingResetDelay:150,enabled:!0,isRtl:!1,useScrollendEvent:!1,useAnimationFrameWithResizeObserver:!1,laneAssignmentMode:"estimate",useCachedMeasurements:!1};for(const d in t){const u=t[d];u!==void 0&&(o[d]=u)}const i=this.options;let l=null,s=null,a=!1;if(i!==void 0&&i.enabled&&o.enabled&&o.anchorTo==="end"&&this.scrollElement!==null){const d=i.count,u=o.count,h=this.getMeasurements(),f=((n=this._singleLaneMeasurements)==null?void 0:n.items)??h,m=k=>ti(f[k]),x=d>0?m(0):null,w=d>0?m(d-1):null;if(u!==d||d>0&&u>0&&(o.getItemKey(0)!==x||o.getItemKey(u-1)!==w)){a=!0;const k=d>0?this.getVirtualItemForOffset(this.getScrollOffset())??h[0]:null;k&&(l=[k.key,this.getScrollOffset()-k.start]);const _=o.followOnAppend===!0?"auto":o.followOnAppend||null;_&&u>0&&this.isAtEnd(i.scrollEndThreshold)&&(d===0||o.getItemKey(u-1)!==w)&&(u>d||wi(d,u,m,o.getItemKey))&&(s=_)}}this.options=o,a&&(this.pendingMin=0,this.itemSizeCacheVersion++);let c=null;if(l&&this.scrollOffset!==null&&!this._awaitingCommandReadBack()){const[d,u]=l,h=this.getMeasurements(),{count:f,getItemKey:m}=this.options;let x=0;for(;x<f&&m(x)!==d;)x++;if(x<f){const w=h[x];if(w){const E=Math.max(0,w.start+u);!s&&E!==this.scrollOffset&&(c=E-this.scrollOffset,this.scrollOffset=E)}}}s?this.pendingScrollAnchor={kind:"follow",behavior:s}:c!==null&&(this._canWriteScroll()?this.pendingScrollAnchor={kind:"anchor",delta:c}:(this._holdOffset+=c,this._followOffsetTarget(c)))},this.notify=t=>{var n,o;(o=(n=this.options).onChange)==null||o.call(n,this,t)},this.maybeNotify=Fe(()=>(this.calculateRange(),[this.isScrolling,this.range?this.range.startIndex:null,this.range?this.range.endIndex:null]),t=>{this.notify(t)},{key:!1,debug:()=>this.options.debug,initialDeps:[this.isScrolling,this.range?this.range.startIndex:null,this.range?this.range.endIndex:null]}),this.cleanup=()=>{var t;this.unsubs.filter(Boolean).forEach(n=>n()),this.unsubs=[],this.observer.disconnect(),this.rafId!=null&&this.targetWindow&&(this.targetWindow.cancelAnimationFrame(this.rafId),this.rafId=null),this.scrollState=null,(t=this._momentumStop)==null||t.restore(),this._momentumStop=null,this.isScrolling=!1,this.scrollDirection=null,this._holdOffset=0,this._reportedOverscroll=!1,this._clampedAdjustment=null,this.pendingWrite=null,this.scrollElement=null,this.targetWindow=null},this._didMount=()=>()=>{this.cleanup()},this._willUpdate=()=>{var t;const n=this.options.enabled?this.options.getScrollElement():null;if(this.scrollElement!==n){if(this.cleanup(),!n){this.maybeNotify();return}this.scrollElement=n,this.scrollElement&&"ownerDocument"in this.scrollElement?this.targetWindow=this.scrollElement.ownerDocument.defaultView:this.targetWindow=((t=this.scrollElement)==null?void 0:t.window)??null,this.elementsCache.forEach(i=>{this.observer.observe(i)}),this.unsubs.push(this.options.observeElementRect(this,i=>{this.scrollRect=i,this.maybeNotify()})),this.unsubs.push(this.options.observeElementOffset(this,(i,l)=>{var s,a,c,d;const u=l?this._elementMaxScrollOffset():null,h=this._reportedOverscroll;this._reportedOverscroll=i<0||u!==null&&i>u+1;const f=i;this._lastElementOffset=f,i=this._toLayoutOffset(i);const m=this._classifyScrollEvent(i,l,u);if(m==="spurious")return;m==="readBack"?i=this.pendingWrite.target:m==="clampedReadBack"&&((s=this.scrollState)==null?void 0:s.index)!=null&&i<this.getMaxScrollOffset()-1.5?this.scrollState.lastTargetOffset=i:si({kind:m,offset:i,command:this.scrollState,target:()=>this.getScrollStateTarget(this.scrollState)})&&(this.scrollState=null),this.pendingWrite=null,this._clampedAdjustment!==null&&Math.abs(i-this._clampedAdjustment.maxAtWrite)>=1.5&&(this._clampedAdjustment=null);const x=this.getScrollOffset(),w=this.scrollDirection;this.scrollDirection=l?x===i?this.scrollDirection:x<i?"forward":"backward":null,this.scrollOffset=i,this.isScrolling=l;const E=this.scrollState;if((E==null?void 0:E.phase)==="queued"&&m==="external"&&l)if(h||this._reportedOverscroll)E.samples=[];else{const b=this.now();E.samples=[...(E.samples??[]).filter(k=>b-k.t<=200),{t:b,offset:f}],(w!==null&&this.scrollDirection!==w||li(E.samples))&&(this.scrollState=null)}this._iosGesture.onScroll({isScrolling:l,ownReadBack:m==="readBack",moved:i!==x,external:m==="external"&&((a=this.scrollState)==null?void 0:a.phase)!=="smooth"&&((c=this.scrollState)==null?void 0:c.phase)!=="smoothFinishing"})&&((d=this.scrollState)==null?void 0:d.phase)==="queued"&&(this.scrollState=null),this._flushHoldIfReady(!0),this.scrollState&&this.scheduleScrollReconcile(),this.maybeNotify()})),"addEventListener"in this.scrollElement&&this.unsubs.push(this._iosGesture.listen(this.scrollElement)),this._scrollToOffset(this.getScrollOffset())}this._noteClampMax();const o=this.pendingScrollAnchor;this.pendingScrollAnchor=null,o&&this.scrollElement&&this.options.enabled&&(o.kind==="anchor"?this._canWriteScroll()?Qe(this.scrollState)&&!Ae(this.getScrollOffset()-o.delta,this.scrollState.lastTargetOffset)||(this._followOffsetTarget(o.delta),this._scrollToOffset(this.getScrollOffset())):(this._holdOffset+=o.delta,this._followOffsetTarget(o.delta),this.notify(!1)):this.scrollToEnd({behavior:o.behavior})),this._flushHoldIfReady(!1),this._retryClampedAdjustment()},this._classifyScrollEvent=(t,n,o)=>{var i;return oi({offset:t,isScrolling:n,elementMax:o,holdOffset:this._holdOffset,scrollOffset:this.scrollOffset,pendingWrite:this.pendingWrite,clampedMaxAtWrite:((i=this._clampedAdjustment)==null?void 0:i.maxAtWrite)??null})},this._retryClampedAdjustment=()=>{if(this._clampedAdjustment===null||!this.scrollElement||!this.options.enabled||!this._canWriteScroll())return;const{target:t,maxAtWrite:n}=this._clampedAdjustment,o=this.getMaxScrollOffset();o>n+.5&&(this._clampedAdjustment=t>o+.5?{target:t,maxAtWrite:o}:null,this._scrollToOffset(t))},this._writeAwaitingCommand=()=>{const t=this.scrollState;if(t===null||t.phase!=="queued")return;const{behavior:n}=t;this.getMeasurements();const o=this.getScrollStateTarget(t);t.lastTargetOffset=o,this._clampedAdjustment=null,t.phase=xr(n,t.index!=null&&Ae(o,this.getScrollOffset())),this._scrollToOffset(o,{behavior:n}),this.scheduleScrollReconcile()},this._readElementOffset=()=>{const t=this.scrollElement;if(t==null)return null;const{horizontal:n,isRtl:o}=this.options;return typeof t.scrollTop=="number"?n?t.scrollLeft*(o&&-1||1):t.scrollTop:typeof t.scrollY=="number"?n?t.scrollX:t.scrollY:null},this._canWriteScroll=()=>!(St()&&this._iosGesture.inMotion())&&!this._reportedOverscroll,this._flushHoldIfReady=t=>{var n;if(this._holdOffset===0||!this.scrollElement||!this.options.enabled||!this._canWriteScroll()||((n=this.scrollState)==null?void 0:n.phase)==="smooth")return;this._holdOffset=0,this.scrollOffset!==null&&this.scrollOffset<0&&(this.scrollOffset=0),this.notify(t);const o=this.getCommandWrittenOffset()??this.getScrollOffset();this._clampedAdjustment=this._clampedBy(o),this._scrollToOffset(o)},this.rafId=null,this.getSize=()=>this.options.enabled?(this.scrollRect=this.scrollRect??this.options.initialRect,this.scrollRect[this.options.horizontal?"width":"height"]):(this.scrollRect=null,0),this.getScrollOffset=()=>this.options.enabled?(this.scrollOffset=this.scrollOffset??(typeof this.options.initialOffset=="function"?this.options.initialOffset():this.options.initialOffset),this.scrollOffset):(this.scrollOffset=null,0),this.getMeasurementOptions=Fe(()=>[this.options.count,this.options.paddingStart,this.options.scrollMargin,this.options.getItemKey,this.options.enabled,this.options.lanes,this.options.laneAssignmentMode,this.options.gap],(t,n,o,i,l,s,a,c)=>(this.prevLanes!==void 0&&this.prevLanes!==s&&(this.lanesChangedFlag=!0),this.prevLanes=s,this.pendingMin=null,{count:t,paddingStart:n,scrollMargin:o,getItemKey:i,enabled:l,lanes:s,laneAssignmentMode:a,gap:c}),{key:!1}),this.isIndexInRange=t=>t>=0&&t<this.options.count,this.getMeasurements=Fe(()=>[this.getMeasurementOptions(),this.itemSizeCacheVersion],({count:t,paddingStart:n,scrollMargin:o,getItemKey:i,enabled:l,lanes:s,laneAssignmentMode:a,gap:c},d)=>{var u;const h=this.itemSizeCache;if(!l)return this.measurementsCache=[],this._singleLaneMeasurements=null,this.itemSizeCache.clear(),this.laneAssignments.clear(),[];if(this.laneAssignments.size>t)for(const b of this.laneAssignments.keys())b>=t&&this.laneAssignments.delete(b);this.lanesChangedFlag&&(this.lanesChangedFlag=!1,this.lanesSettling=!0,this.measurementsCache=[],this._singleLaneMeasurements=null,this.itemSizeCache.clear(),this.laneAssignments.clear(),this.pendingMin=null),this.measurementsCache.length===0&&!this.lanesSettling&&(this.measurementsCache=this.options.initialMeasurementsCache,this.measurementsCache.forEach(b=>{this.itemSizeCache.set(b.key,b.size)}));const f=this.lanesSettling?0:this.pendingMin??0;if(this.pendingMin=null,this.lanesSettling&&this.measurementsCache.length===t&&(this.lanesSettling=!1),s===1){const b=t*2;let k=(u=this._singleLaneMeasurements)==null?void 0:u.flat;if(!k||k.length<b){const P=new Float64Array(b);k&&f>0&&P.set(k.subarray(0,f*2)),k=P}const _=f===0?new Array(t):this._singleLaneMeasurements.items.slice();let v;if(f===0)v=n+o;else{const P=f-1;v=k[P*2]+k[P*2+1]+c}for(let P=f;P<t;P++){const p=i(P);_[P]=p;const y=h.get(p),S=typeof y=="number"?y:this.options.estimateSize(P);k[P*2]=v,k[P*2+1]=S,v+=S+c}this._singleLaneMeasurements={flat:k,items:_};const R=ri(_,k);return this.measurementsCache=R,R}const m=this.measurementsCache.slice(0,f),x=new Array(s).fill(void 0),w=new Float64Array(s);let E=0;for(let b=0;b<f;b++){const k=m[b];k&&(x[k.lane]===void 0&&E++,x[k.lane]=b,w[k.lane]=k.end)}for(let b=f;b<t;b++){const k=i(b),_=this.laneAssignments.get(b);let v,R;const P=a==="estimate"||h.has(k);if(_!==void 0&&this.options.lanes>1){v=_;const g=x[v],M=g!==void 0?m[g]:void 0;R=M?M.end+c:n+o}else if(E===s){let g=0,M=w[0],L=x[0];for(let T=1;T<s;T++){const $=w[T];($<M||$===M&&x[T]<L)&&(g=T,M=$,L=x[T])}v=g,R=M+c,P&&this.laneAssignments.set(b,v)}else v=b%this.options.lanes,R=n+o,P&&this.laneAssignments.set(b,v);const p=h.get(k),y=typeof p=="number"?p:this.options.estimateSize(b),S=R+y;m[b]={index:b,start:R,size:y,end:S,key:k,lane:v},x[v]===void 0&&E++,x[v]=b,w[v]=S}return this.measurementsCache=m,m},{key:!1,debug:()=>this.options.debug}),this.calculateRange=Fe(()=>[this.getMeasurements(),this.getSize(),this.getScrollOffset(),this.options.lanes,this._getLayoutTotalSize()+this.options.scrollMargin],(t,n,o,i,l)=>{if(t.length===0||n===0)return this.range=null,null;const s=Math.max(l-n,0);return this.range=_i(t,n,Math.min(o,s),i,i===1&&this._singleLaneMeasurements!==null?this._singleLaneMeasurements.flat:null),this.range},{key:!1,debug:()=>this.options.debug}),this.getVirtualIndexes=Fe(()=>{let t=null,n=null;const o=this.calculateRange();return o&&(t=o.startIndex,n=o.endIndex),this.maybeNotify.updateDeps([this.isScrolling,t,n]),[this.options.rangeExtractor,this.options.overscan,this.options.count,t,n,this.options.lanes]},(t,n,o,i,l,s)=>i===null||l===null?[]:t({startIndex:i,endIndex:l,overscan:n,count:o,lanes:s}),{key:!1,debug:()=>this.options.debug}),this.indexFromElement=t=>{const n=this.options.indexAttribute,o=t.getAttribute(n);return o?parseInt(o,10):(console.warn(`Missing attribute name '${n}={index}' on measured element.`),-1)},this.shouldMeasureDuringScroll=t=>{var n;if(!Qe(this.scrollState))return!0;const o=this.scrollState.index??((n=this.getVirtualItemForOffset(this.scrollState.lastTargetOffset))==null?void 0:n.index);if(o!==void 0&&this.range){const i=Math.max(this.options.overscan,Math.ceil((this.range.endIndex-this.range.startIndex)/2)),l=Math.max(0,o-i),s=Math.min(this.options.count-1,o+i);return t>=l&&t<=s}return!0},this.measureElement=t=>{if(!t){this.elementsCache.forEach((l,s)=>{l.isConnected||(this.observer.unobserve(l),this.elementsCache.delete(s))});return}const n=this.indexFromElement(t);if(!this.isIndexInRange(n))return;const o=this.options.getItemKey(n),i=this.elementsCache.get(o);i!==t&&(i&&this.observer.unobserve(i),this.observer.observe(t),this.elementsCache.set(o,t)),t.isConnected&&(!this.isScrolling||this.scrollState)&&this.shouldMeasureDuringScroll(n)&&this.resizeItem(n,this.options.measureElement(t,void 0,this))},this.resizeItem=(t,n)=>{var o,i,l;if(!this.isIndexInRange(t))return;(o=this._resizeBatch)!=null&&o.sync&&this.getMeasurements();let s,a,c;const d=(i=this._singleLaneMeasurements)==null?void 0:i.flat;if(this.options.lanes===1&&d!=null)c=this.options.getItemKey(t),a=d[t*2],s=d[t*2+1];else{const f=this.measurementsCache[t];if(!f)return;c=f.key,a=f.start,s=f.size}const u=this.itemSizeCache.get(c)??s,h=n-u;if(h!==0){const f=this.options.anchorTo==="end"&&!Qe(this.scrollState)&&this.getVirtualDistanceFromEnd()<=this.options.scrollEndThreshold,m=f?this._getLayoutTotalSize():0,x=this.getScrollOffset(),E=!this.itemSizeCache.has(c)?a<x:a+u<=x&&this.scrollDirection!=="backward",b=!Qe(this.scrollState)&&(this.shouldAdjustScrollPositionOnItemSizeChange!==void 0?this.shouldAdjustScrollPositionOnItemSizeChange(this.measurementsCache[t]??{index:t,key:c,start:a,size:s,end:a+s,lane:0},h,this):E);(this.pendingMin===null||t<this.pendingMin)&&(this.pendingMin=t),this.itemSizeCache.set(c,n),this.itemSizeCacheVersion++;let k=!1;if(this._awaitingCommandReadBack()||(f?k=this.applyScrollAdjustment(this._getLayoutTotalSize()-m):b&&(k=this.applyScrollAdjustment(h))),this._resizeBatch){this._resizeBatch.notify=!0,(l=this._resizeBatch).sync||(l.sync=k);return}this.notify(k),this._noteClampMax(),this._flushHoldIfReady(!0),this._retryClampedAdjustment()}},this.getVirtualItems=Fe(()=>[this.getVirtualIndexes(),this.getMeasurements(),this._holdOffset],(t,n,o)=>{const i=[];for(let l=0,s=t.length;l<s;l++){const a=t[l],c=n[a];i.push(o===0?c:{...c,start:c.start-o,end:c.end-o})}return i},{key:!1,debug:()=>this.options.debug}),this.getVirtualItemForOffset=t=>{var n;const o=this.getMeasurements();if(o.length===0)return;const i=(n=this._singleLaneMeasurements)==null?void 0:n.flat,l=this.options.lanes===1&&i!=null,s=un(0,o.length-1,l?a=>i[a*2]:a=>mr(o[a]).start,t);return mr(o[s])},this._noteClampMax=()=>{if(!this._awaitingCommandReadBack())return;const t=this._elementMaxScrollOffset();if(t===null)return;const n=this.pendingWrite,o=Math.max(t,0)+this._holdOffset;if(o>=n.target)return;const i=n.lowMaxes??(n.lowMaxes=[]);i[i.length-1]!==o&&i.push(o)},this.getMaxScrollOffset=()=>(this._elementMaxScrollOffset()??0)+this._holdOffset,this._toLayoutOffset=t=>{var n;let o=t+this._holdOffset;return((n=this.pendingScrollAnchor)==null?void 0:n.kind)==="anchor"&&(o+=this.pendingScrollAnchor.delta),o},this._elementMaxScrollOffset=()=>{const t=this.scrollElement;if(t===null)return null;if("scrollHeight"in t)return this.options.horizontal?t.scrollWidth-t.clientWidth:t.scrollHeight-t.clientHeight;if("document"in t){const n=t.document.documentElement;return this.options.horizontal?n.scrollWidth-t.innerWidth:n.scrollHeight-t.innerHeight}return null},this._momentumStop=null,this._stopMomentum=t=>{const n=this.scrollElement,o=this.targetWindow;if(n===null||o===null)return;const i="document"in n?n.document.scrollingElement:n;if(!(i!=null&&i.style))return;if(this._momentumStop){this._momentumStop.done=t;return}const{style:l}=i,s=this.options.horizontal?"overflow-x":"overflow-y",a=l.getPropertyValue(s),c=l.getPropertyPriority(s),d=()=>this.options.horizontal?i.clientHeight:i.clientWidth,u=d();if(l.setProperty(s,"hidden","important"),d()!==u){l.setProperty(s,a,c);return}const h={restore:()=>l.getPropertyValue(s)!=="hidden"||l.getPropertyPriority(s)!=="important"?!1:(l.setProperty(s,a,c),!0),done:t};this._momentumStop=h,o.requestAnimationFrame(()=>o.requestAnimationFrame(()=>{this._momentumStop===h&&(this._momentumStop=null,h.restore()&&h.done())}))},this._clampedBy=t=>{const n=this._elementMaxScrollOffset();if(n===null)return null;const o=n+this._holdOffset;return t>o+.5?{target:t,maxAtWrite:o}:null},this.getVirtualDistanceFromEnd=()=>Math.max(this._getLayoutTotalSize()+this.options.scrollMargin-this.getSize()-this.getScrollOffset(),0),this.getDistanceFromEnd=()=>Math.max(this.getMaxScrollOffset()-this.getScrollOffset(),0),this.isAtEnd=(t=this.options.scrollEndThreshold)=>this.getDistanceFromEnd()<=t,this.getOffsetForAlignment=(t,n,o=0)=>{if(!this.scrollElement)return 0;const i=this.getSize(),l=this.getScrollOffset();n==="auto"&&(n=t>=l+i?"end":"start"),n==="center"?t+=(o-i)/2:n==="end"&&(t-=i);const s=this.getMaxScrollOffset();return Math.max(Math.min(s,t),0)},this.getOffsetForIndex=(t,n="auto")=>{t=Math.max(0,Math.min(t,this.options.count-1));const o=this.getSize(),i=this.getScrollOffset(),l=this.getMeasurements()[t];if(!l)return;if(n==="auto")if(l.end>=i+o-this.options.scrollPaddingEnd)n="end";else if(l.start<=i+this.options.scrollPaddingStart)n="start";else return[i,n];if(n==="end"&&t===this.options.count-1){const a=this.getMaxScrollOffset(),c=a-this.options.paddingEnd+this.options.scrollPaddingEnd;return[Math.max(Math.min(c,a),0),n]}const s=n==="end"?l.end+this.options.scrollPaddingEnd:l.start-this.options.scrollPaddingStart;return[this.getOffsetForAlignment(s,n,l.size),n]},this.scrollToOffset=(t,{align:n="start",behavior:o="auto"}={})=>{this._startScroll({index:null,align:n},this.getOffsetForAlignment(t,n),o,"absolute")},this.scrollToIndex=(t,{align:n="auto",behavior:o="auto"}={})=>{t=Math.max(0,Math.min(t,this.options.count-1));const i=this.getOffsetForIndex(t,n);if(!i)return;const[l,s]=i;this._startScroll({index:t,align:s},l,o,"absolute")},this.scrollBy=(t,{behavior:n="auto"}={})=>{const o=this.getOffsetForAlignment((this.getCommandWrittenOffset()??this.getScrollOffset())+t,"start");this._startScroll({index:null,align:"start"},o,n,"relative")},this.scrollToEnd=({behavior:t="auto"}={})=>{if(this.options.count>0){this._startScroll({index:this.options.count-1,align:"end",toEnd:!0},Math.max(this.getMaxScrollOffset(),0),t,"absolute");return}this.scrollToOffset(Math.max(this.getTotalSize()-this.getSize(),0),{behavior:t})},this.cancelScroll=()=>{this.rafId!=null&&this.targetWindow&&(this.targetWindow.cancelAnimationFrame(this.rafId),this.rafId=null),this.scrollState=null},this.getTotalSize=()=>Math.max(this._getLayoutTotalSize()-this._holdOffset,0),this._getLayoutTotalSize=()=>{var t,n;const o=this.getMeasurements();let i;if(o.length===0)i=this.options.paddingStart;else if(this.options.lanes===1){const l=o.length-1,s=(t=this._singleLaneMeasurements)==null?void 0:t.flat;s!=null?i=s[l*2]+s[l*2+1]:i=((n=o[l])==null?void 0:n.end)??0}else{const l=Array(this.options.lanes).fill(null);let s=o.length-1;for(;s>=0&&l.some(a=>a===null);){const a=o[s];l[a.lane]===null&&(l[a.lane]=a.end),s--}i=Math.max(...l.filter(a=>a!==null))}return Math.max(i-this.options.scrollMargin+this.options.paddingEnd,0)},this.takeSnapshot=()=>{const t=[];if(this.itemSizeCache.size===0)return t;const n=this.getMeasurements();for(const o of n)o&&this.itemSizeCache.has(o.key)&&t.push({index:o.index,key:o.key,start:o.start,size:o.size,end:o.end,lane:o.lane});return t},this._scrollToOffset=(t,{adjustments:n,behavior:o}={})=>{const i={target:t+(n??0),smooth:o==="smooth"};return this.pendingWrite=i,this.options.scrollToFn(t-this._holdOffset,{behavior:o,adjustments:n},this),i},this.getCommandWrittenOffset=()=>this.scrollState!==null&&this.pendingWrite!==null&&!this.pendingWrite.smooth?this.pendingWrite.target:null,this._awaitingCommandReadBack=()=>{const t=this.getCommandWrittenOffset();return!(St()&&this._iosGesture.dragging())&&t!==null&&!Ae(t,this.getScrollOffset())},this._followOffsetTarget=t=>{this.scrollState!==null&&this.scrollState.index==null&&(this.scrollState.lastTargetOffset+=t)},this.measure=()=>{this.pendingMin=null,this.itemSizeCache.clear(),this.laneAssignments.clear(),this.itemSizeCacheVersion++,this.notify(!1)},this.setOptions(r)}get scrollAdjustments(){return 0}applyScrollAdjustment(r,t){if(r===0)return!1;if(this._followOffsetTarget(r),this._canWriteScroll()){const n=this.getScrollOffset();this._clampedAdjustment=this._clampedBy(n+r);const o=this._scrollToOffset(n,{adjustments:r,behavior:t});return this.scrollOffset!==null&&(this.pendingWrite===o&&(this.scrollOffset+=r),this.scrollOffset<0&&(this.scrollOffset=0)),!0}else return this._holdOffset+=r,this.scrollOffset!==null&&(this.scrollOffset+=r),!0}scheduleScrollReconcile(){if(!this.targetWindow){this.scrollState=null;return}this.rafId==null&&(this.rafId=this.targetWindow.requestAnimationFrame(()=>{this.rafId=null,this.reconcileScroll()}))}getScrollStateTarget(r){const t=r.toEnd?[Math.max(this.getMaxScrollOffset(),0)]:r.index!=null?this.getOffsetForIndex(r.index,r.align):void 0;return t?t[0]:r.lastTargetOffset}reconcileScroll(){if(!this.scrollState||!this.scrollElement)return;if(this.now()-this.scrollState.startedAt>5e3){this.scrollState=null;return}if(this.scrollState.phase==="queued"){this.scheduleScrollReconcile();return}this.getMeasurements();const n=this.getScrollStateTarget(this.scrollState),o=this.scrollState.index==null?1:this.options.useAnimationFrameWithResizeObserver?3:2,i=n!==this.scrollState.lastTargetOffset;if(!i&&Ae(n,this.getScrollOffset())){if(this.scrollState.phase==="smooth"?this.scrollState.phase="smoothLanded":this.scrollState.phase==="smoothFinishing"&&(this.scrollState.phase="instant"),this.scrollState.stableFrames++,this.scrollState.stableFrames>=o){this.getScrollOffset()!==n&&this._scrollToOffset(n,{behavior:"auto"}),this.scrollState=null;return}}else if(this.scrollState.stableFrames=0,i){const l=this.getSize()||600,s=Math.abs(n-this.getScrollOffset()),a=Qe(this.scrollState)&&s>l;this.scrollState.lastTargetOffset=n,a?this.scrollState.phase="smooth":this.scrollState.phase==="smooth"?this.scrollState.phase="smoothFinishing":this.scrollState.phase==="smoothLanded"&&(this.scrollState.phase="instant"),this._scrollToOffset(n,{behavior:a?"smooth":"auto"})}this.scheduleScrollReconcile()}_startScroll(r,t,n,o){this.pendingScrollAnchor=null,this._clampedAdjustment=null;const i=this._iosGesture.tail();if(o==="absolute"&&i!==null){if(i==="fling"&&di()){this._stopMomentum(()=>{const l=this.scrollState;(l==null?void 0:l.phase)!=="queued"||this._iosGesture.tail()!=="fling"||this._reportedOverscroll||(this._iosGesture.end(),this._flushHoldIfReady(!0),this._writeAwaitingCommand())}),this.scrollState={...r,startedAt:this.now(),lastTargetOffset:t,stableFrames:0,phase:"queued",behavior:n,samples:[]},this.scheduleScrollReconcile();return}this._iosGesture.end()}this.scrollState={...r,startedAt:this.now(),lastTargetOffset:t,stableFrames:0,behavior:n,phase:xr(n,r.index!=null&&Ae(t,this.getScrollOffset()))},this._scrollToOffset(t,{behavior:n}),this.scheduleScrollReconcile()}}const un=(e,r,t,n)=>{for(;e<=r;){const o=(e+r)/2|0,i=t(o);if(i<n)e=o+1;else if(i>n)r=o-1;else return o}return e>0?e-1:0};function Si(e,r,t){let n=0;for(;n<=r;){const o=(n+r)/2|0,i=e[o*2];if(i<t)n=o+1;else if(i>t)r=o-1;else return o}return n>0?n-1:0}function _i(e,r,t,n,o){const i=e.length-1;if(e.length<=n)return{startIndex:0,endIndex:i};if(n===1&&o!==null){const c=Si(o,i,t);let d=c;const u=t+r;for(;d<i&&o[d*2]+o[d*2+1]<u;)d++;return{startIndex:c,endIndex:d}}let s=un(0,i,c=>e[c].start,t),a=s;if(n===1)for(;a<i&&e[a].end<t+r;)a++;else if(n>1){const c=Array(n).fill(0);for(;a<i&&c.some(u=>u<t+r);){const u=e[a];c[u.lane]=u.end,a++}const d=Array(n).fill(t+r);for(;s>=0&&d.some(u=>u>=t);){const u=e[s];d[u.lane]=u.start,s--}s=Math.max(0,s-s%n),a=Math.min(i,a+(n-1-a%n))}return{startIndex:s,endIndex:a}}const Vt=Symbol("store-raw"),Ne=Symbol("store-node"),xe=Symbol("store-has"),fn=Symbol("store-self");function pn(e){let r=e[ue];if(!r&&(Object.defineProperty(e,ue,{value:r=new Proxy(e,Ii)}),!Array.isArray(e))){const t=Object.keys(e),n=Object.getOwnPropertyDescriptors(e),o=Object.getPrototypeOf(e),i=o!==null&&e!==null&&typeof e=="object"&&!Array.isArray(e)&&o!==Object.prototype;if(i){const l=Object.getOwnPropertyDescriptors(o);t.push(...Object.keys(l)),Object.assign(n,l)}for(let l=0,s=t.length;l<s;l++){const a=t[l];i&&a==="constructor"||n[a].get&&Object.defineProperty(e,a,{configurable:!0,enumerable:n[a].enumerable,get:n[a].get.bind(r)})}}return r}function _e(e){let r;return e!=null&&typeof e=="object"&&(e[ue]||!(r=Object.getPrototypeOf(e))||r===Object.prototype||Array.isArray(e))}function We(e,r=new Set){let t,n,o,i;if(t=e!=null&&e[Vt])return t;if(!_e(e)||r.has(e))return e;if(Array.isArray(e)){Object.isFrozen(e)?e=e.slice(0):r.add(e);for(let l=0,s=e.length;l<s;l++)o=e[l],(n=We(o,r))!==o&&(e[l]=n)}else{Object.isFrozen(e)?e=Object.assign({},e):r.add(e);const l=Object.keys(e),s=Object.getOwnPropertyDescriptors(e);for(let a=0,c=l.length;a<c;a++)i=l[a],!s[i].get&&(o=e[i],(n=We(o,r))!==o&&(e[i]=n))}return e}function _t(e,r){let t=e[r];return t||Object.defineProperty(e,r,{value:t=Object.create(null)}),t}function ot(e,r,t){if(e[r])return e[r];const[n,o]=N(t,{equals:!1,internal:!0});return n.$=o,e[r]=n}function zi(e,r){const t=Reflect.getOwnPropertyDescriptor(e,r);return!t||t.get||!t.configurable||r===ue||r===Ne||(delete t.value,delete t.writable,t.get=()=>e[ue][r]),t}function hn(e){Lt()&&ot(_t(e,Ne),fn)()}function Oi(e){return hn(e),Reflect.ownKeys(e)}const Ii={get(e,r,t){if(r===Vt)return e;if(r===ue)return t;if(r===pt)return hn(e),t;const n=_t(e,Ne),o=n[r];let i=o?o():e[r];if(r===Ne||r===xe||r==="__proto__")return i;if(!o){const l=Object.getOwnPropertyDescriptor(e,r);Lt()&&(typeof i!="function"||Object.prototype.hasOwnProperty.call(e,r))&&!(l&&l.get)&&(i=ot(n,r,i)())}return _e(i)?pn(i):i},has(e,r){return r===Vt||r===ue||r===pt||r===Ne||r===xe||r==="__proto__"?!0:(Lt()&&ot(_t(e,xe),r)(),r in e)},set(){return!0},deleteProperty(){return!0},ownKeys:Oi,getOwnPropertyDescriptor:zi};function le(e,r,t,n=!1){if(r==="__proto__"||!n&&e[r]===t)return;const o=e[r],i=e.length;t===void 0?(delete e[r],e[xe]&&e[xe][r]&&o!==void 0&&e[xe][r].$()):(e[r]=t,e[xe]&&e[xe][r]&&o===void 0&&e[xe][r].$());let l=_t(e,Ne),s;if((s=ot(l,r,o))&&s.$(()=>t),Array.isArray(e)&&e.length!==i){for(let a=e.length;a<i;a++)(s=l[a])&&s.$();(s=ot(l,"length",i))&&s.$(e.length)}(s=l[fn])&&s.$()}function mn(e,r){const t=Object.keys(r);for(let n=0;n<t.length;n+=1){const o=t[n];gn(o)||le(e,o,r[o])}}function gn(e){return e==="__proto__"||e==="constructor"||e==="prototype"}function Ai(e,r){if(typeof r=="function"&&(r=r(e)),r=We(r),Array.isArray(r)){if(e===r)return;let t=0,n=r.length;for(;t<n;t++){const o=r[t];e[t]!==o&&le(e,t,o)}le(e,"length",n)}else mn(e,r)}function et(e,r,t=[]){let n,o=e;if(r.length>1){n=r.shift();const l=typeof n,s=Array.isArray(e);if(l==="string"&&(n==="__proto__"||r.length>1&&gn(n)))return;if(Array.isArray(n)){for(let a=0;a<n.length;a++)et(e,[n[a]].concat(r),t);return}else if(s&&l==="function"){for(let a=0;a<e.length;a++)n(e[a],a)&&et(e,[a].concat(r),t);return}else if(s&&l==="object"){const{from:a=0,to:c=e.length-1,by:d=1}=n;for(let u=a;u<=c;u+=d)et(e,[u].concat(r),t);return}else if(r.length>1){et(e[n],r,[n].concat(t));return}o=e[n],t=[n].concat(t)}let i=r[0];typeof i=="function"&&(i=i(o,t),i===o)||n===void 0&&i==null||(i=We(i),n===void 0||_e(o)&&_e(i)&&!Array.isArray(i)?mn(o,i):le(e,n,i))}function Ci(...[e,r]){const t=We(e||{}),n=Array.isArray(t),o=pn(t);function i(...l){An(()=>{n&&l.length===1?Ai(t,l[0]):et(t,l)})}return[o,i]}const Ut=Symbol("store-root");function yr(e){return e==="__proto__"||e==="constructor"||e==="prototype"}function De(e,r,t,n,o){if(yr(t))return;const i=r[t];if(e===i)return;const l=Array.isArray(e);if(t!==Ut&&(!_e(e)||!_e(i)||l!==Array.isArray(i)||o&&e[o]!==i[o])){le(r,t,e);return}if(l){if(e.length&&i.length&&(!n||o&&e[0]&&e[0][o]!=null)){let c,d,u,h,f,m,x,w;for(u=0,h=Math.min(i.length,e.length);u<h&&(i[u]===e[u]||o&&i[u]&&e[u]&&i[u][o]&&i[u][o]===e[u][o]);u++)De(e[u],i,u,n,o);const E=new Array(e.length),b=new Map;for(h=i.length-1,f=e.length-1;h>=u&&f>=u&&(i[h]===e[f]||o&&i[h]&&e[f]&&i[h][o]&&i[h][o]===e[f][o]);h--,f--)E[f]=i[h];if(u>f||u>h){for(d=u;d<=f;d++)le(i,d,e[d]);for(;d<e.length;d++)le(i,d,E[d]),De(e[d],i,d,n,o);i.length!==e.length&&le(i,"length",e.length);return}for(x=new Array(f+1),d=f;d>=u;d--)m=e[d],w=o&&m?m[o]:m,c=b.get(w),x[d]=c===void 0?-1:c,b.set(w,d);for(c=u;c<=h;c++)m=i[c],w=o&&m?m[o]:m,d=b.get(w),d!==void 0&&d!==-1&&(E[d]=i[c],d=x[d],b.set(w,d));for(d=u;d<e.length;d++)d in E?(le(i,d,E[d]),De(e[d],i,d,n,o)):le(i,d,e[d])}else for(let c=0,d=e.length;c<d;c++)De(e[c],i,c,n,o);i.length!==e.length&&le(i,"length",e.length);return}const s=Object.keys(e);for(let c=0,d=s.length;c<d;c++)yr(s[c])||De(e[s[c]],i,s[c],n,o);const a=Object.keys(i);for(let c=0,d=a.length;c<d;c++)e[a[c]]===void 0&&le(i,a[c],void 0)}function vr(e,r={}){const{merge:t,key:n="id"}=r,o=We(e);return i=>{if(!_e(i)||!_e(o))return o;const l=De(o,{[Ut]:i},Ut,t,n);return l===void 0?i:l}}function Ei(e){const r=Ce(e),t=new ki(r),[n,o]=Ci(t.getVirtualItems()),[i,l]=N(t.getTotalSize()),s={get(c,d){switch(d){case"getVirtualItems":return()=>n;case"getTotalSize":return()=>i();default:return Reflect.get(c,d)}}},a=new Proxy(t,s);return a.setOptions(r),Be(()=>{const c=a._didMount();a._willUpdate(),Ot(c)}),In(()=>{a.setOptions(Ce(r,e,{onChange:(c,d)=>{var u;c._willUpdate(),o(vr(c.getVirtualItems(),{key:"index"})),l(c.getTotalSize()),(u=e.onChange)==null||u.call(e,c,d)}})),a._willUpdate(),o(vr(t.getVirtualItems(),{key:"index"})),l(t.getTotalSize())}),a}function Xt(e){return Ei(Ce({observeElementRect:hi,observeElementOffset:bi,scrollToFn:vi},e))}const Yt=()=>{const e=Me(Wr);if(e===void 0)throw new Error("useDatasetId must be used within a DataProvider");return e},bn=()=>{const e=Me(Vr);if(e===void 0)throw new Error("useMoves must be used within a DataProvider");return e},Mi=()=>{const e=Me(Ur);if(e===void 0)throw new Error("useSheetId must be used within a DataProvider");return e},K=e=>{const r=e.toLowerCase().replace(/[^a-z0-9]+/g,"");return no[r]??r};var Pi=D('<ul class="dz-suggest absolute top-full right-0 left-0 z-50 border"role=listbox>'),Ti=D('<div><input class="w-full min-w-0 border-b p-1"autocomplete=off>'),$i=D("<li role=option>");const wr=e=>e.normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g,""),xn=e=>{const[r,t]=At(e,["class","autocompleteList","suggest","onPick","oninput","onInput"]),[n,o]=N(""),[i,l]=N(!1),[s,a]=N(0),c=V(()=>{const u=wr(n());if(!r.suggest||u.length<2)return[];const h=[],f=[];for(const m of r.suggest){const x=wr(m);x!==u&&(x.startsWith(u)?h.push(m):x.includes(u)&&f.push(m))}return[...h,...f].slice(0,8)}),d=u=>{var h;l(!1),(h=r.onPick)==null||h.call(r,u)};return(()=>{var u=Ti(),h=u.firstChild;return Ct(h,Ce(t,{onInput:f=>{o(f.currentTarget.value),l(!0),a(0);const m=r.oninput??r.onInput;typeof m=="function"&&m(f)},onKeyDown:f=>{const m=c();!i()||!m.length||(f.key==="ArrowDown"?(f.preventDefault(),a(x=>(x+1)%m.length)):f.key==="ArrowUp"?(f.preventDefault(),a(x=>(x-1+m.length)%m.length)):f.key==="Enter"||f.key==="Tab"?(f.key==="Enter"&&f.preventDefault(),d(m[s()])):f.key==="Escape"&&l(!1))},onBlur:()=>l(!1)}),!1,!1),C(u,I(qe,{get when(){return Rr(()=>!!i())()&&c().length>0},get children(){var f=Pi();return C(f,I(me,{get each(){return c()},children:(m,x)=>(()=>{var w=$i();return w.addEventListener("mouseenter",()=>a(x())),w.$$mousedown=E=>{E.preventDefault(),d(m)},C(w,m),X(E=>{var b=x()===s(),k=oe("cursor-pointer px-1 py-0.5",x()===s()&&"dz-suggest-on");return b!==E.e&&Ge(w,"aria-selected",E.e=b),k!==E.t&&ce(w,E.t=k),E},{e:void 0,t:void 0}),w})()})),f}}),null),X(()=>ce(u,oe("relative w-full min-w-0",r.class))),u})()};Ke(["mousedown"]);var Fi=D("<select>"),Ri=D("<option>");const ye=e=>{const[r,t]=At(e,["class","options"]);return(()=>{var n=Fi();return Ct(n,Ce({get class(){return oe("w-full min-w-0 cursor-pointer rounded border px-1 text-center disabled:opacity-50",r.class)}},t),!1,!0),C(n,I(me,{get each(){return r.options},children:o=>(()=>{var i=Ri();return C(i,()=>o.label),X(()=>i.value=o.value),i})()})),n})()};var Li=D("<div>"),Di=D('<div class="absolute top-0 left-0 w-full">');const Zt=e=>(()=>{var r=Li();return C(r,I(me,{get each(){return e.virtualizer.getVirtualItems()},children:t=>(()=>{var n=Di();return C(n,()=>e.children(e.items[t.index],t.index)),X(o=>{var i=`${t.size}px`,l=`translateY(${t.start}px)`;return i!==o.e&&te(n,"height",o.e=i),l!==o.t&&te(n,"transform",o.t=l),o},{e:void 0,t:void 0}),n})()})),X(t=>{var n=`${e.virtualizer.getTotalSize()}px`,o=oe("relative w-full",e.class);return n!==t.e&&te(r,"height",t.e=n),o!==t.t&&ce(r,t.t=o),t},{e:void 0,t:void 0}),r})();function ji(e,r,t){return`https://docs.google.com/spreadsheets/d/${e}/edit#gid=${r}&range=${encodeURIComponent(t)}`}function Ni(e,r){return e.origin===r.origin&&e.pathname===r.pathname}function Gi(e){return!e||e==="about:blank"||e==="about:newtab"||e==="chrome://newtab/"||e.startsWith("chrome://new-tab-page")}async function yn({gid:e,range:r},t){const n=ji(t,e,r);try{const[o]=await Le.tabs.query({active:!0,currentWindow:!0});if(o!=null&&o.url&&o.id!==void 0){const i=new URL(o.url),l=new URL(n);if(Ni(i,l)){const s=new URLSearchParams(i.hash.substring(1));s.get("gid")===String(e)?(s.set("range",r),i.hash=s.toString(),await Le.tabs.update(o.id,{url:i.toString()})):await Le.tabs.update(o.id,{url:n});return}}Gi(o==null?void 0:o.url)&&(o==null?void 0:o.id)!==void 0?await Le.tabs.update(o.id,{url:n}):await Le.tabs.create({url:n})}catch(o){console.error("Error opening range:",o)}}var Wi=D('<div class="relative h-full min-h-0 w-full bg-contain bg-center bg-no-repeat">');const Jt=e=>(()=>{var r=Wi();return X(t=>{var n=Dr[e.type]??"#999",o=`url(${globalThis.__DZ_BASE}icons/${e.type}.svg?v=2)`;return n!==t.e&&te(r,"background-color",t.e=n),o!==t.t&&te(r,"background-image",t.t=o),t},{e:void 0,t:void 0}),r})();var Bi=D('<div><div class="dz-row-line pointer-events-none absolute right-0 left-0"style=z-index:40></div><div class="min-w-0 flex-1"></div><div class="z-30 mr-1 flex flex-none flex-col place-items-center py-1"></div><div class="min-w-0 flex-1">'),Vi=D('<div class="z-10 flex w-6.5 shrink-0 cursor-pointer flex-col gap-px border-r"style=background-color:var(--dz-line)>'),Ui=D('<div class="relative h-full min-w-0 flex-[1000_1_0%]"style=max-width:80px><div style="background-size:100% 100%;background-repeat:no-repeat;image-rendering:pixelated">'),qi=D('<div class="inline text-sm italic">(<!>)'),Ki=D('<div class="max-w-full flex-3 overflow-hidden bg-black/50 px-0.5 whitespace-nowrap"><div>'),Hi=D('<div class="flex flex-2 items-center text-[11px] [text-shadow:0_0_2px_var(--color-black)]"><div class="flex w-[15.9em] items-center"></div><span class="ml-[3px] rounded-[3px] bg-black/50 px-[2px] text-xs font-bold italic">'),Xi=D('<div class="w-[0.42em] flex-none text-center opacity-80">|'),Yi=D('<div class="flex-[1_1_auto] text-center"><span class="dz-stat rounded-[3px] bg-black/50 px-px font-bold">'),Zi=D('<div class="flex w-24 shrink-0 flex-col justify-center gap-0.5 text-[10px] font-bold">'),Ji=D('<div class="bg-ability/25 text-center">');const vn=52,wn=2,Qi=(vn-wn)/30,es=1.75,ts={charizardmegax:10,charizardmegay:10},rs={stoutland:1.125,tyrantrum:1.2,clefable:1.15,grumpig:1.2,vanillish:1.1,vanilluxe:1.1,shiinotic:1.05,altariamega:1.05,whiscash:1.125,gourgeistsmall:.9,gourgeistsuper:1.12},ns={wailord:1},kr=vn-wn,os=e=>(()=>{var r=Bi(),t=r.firstChild,n=t.nextSibling,o=n.nextSibling;return o.nextSibling,r.$$click=()=>e.data.range&&yn(e.data.range,e.sheetId),C(r,I(is,{get data(){return e.data}}),n),C(r,I(ss,{get data(){return e.data},get datasetId(){return e.datasetId}}),n),C(o,I(ls,{get data(){return e.data}}),null),C(o,I(as,{get data(){return e.data}}),null),C(r,I(cs,{get data(){return e.data}}),null),X(()=>ce(r,oe("relative flex h-full border-b border-transparent",e.data.range&&"cursor-pointer"))),r})(),is=e=>{const[,r]=Mt();return(()=>{var t=Vi();return t.$$click=n=>{n.stopPropagation(),r(e.data.name)},C(t,I(me,{get each(){return e.data.types},children:n=>I(Jt,{type:n})})),t})()},ss=e=>{const r=()=>K(e.data.name),t=()=>e.data.spriteY??[0,30],n=()=>ns[r()],o=()=>{const[a,c]=t();if(n()!==void 0)return(kr-2*n())/(c-a);const d=Qi*(rs[r()]??1);return Math.min(d,kr/(30-a))},i=()=>n()!==void 0?n()-(30-t()[1])*o():0,l=()=>(e.data.spriteW??40)*o(),s=()=>ts[r()]??0;return(()=>{var a=Ui(),c=a.firstChild;return X(d=>{var u=oe("dz-sprite absolute -scale-x-100",s()?"z-20":"z-0"),h=`${i()}px`,f=`${l()}px`,m=`${30*o()}px`,x=`calc(max(${es}px, 50% - ${l()/2}px) - ${s()}px)`,w=`url(${globalThis.__DZ_BASE}calcsprites/${r()}.png)`;return u!==d.e&&ce(c,d.e=u),h!==d.t&&te(c,"bottom",d.t=h),f!==d.a&&te(c,"width",d.a=f),m!==d.o&&te(c,"height",d.o=m),x!==d.i&&te(c,"left",d.i=x),w!==d.n&&te(c,"background-image",d.n=w),d},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0,n:void 0}),a})()},ls=e=>(()=>{var r=Ki(),t=r.firstChild;return C(t,()=>e.data.baseSpecies??e.data.name),C(r,I(qe,{get when(){return e.data.form},get children(){return[" ",(()=>{var n=qi(),o=n.firstChild,i=o.nextSibling;return i.nextSibling,C(n,()=>e.data.form,i),n})()]}}),null),X(()=>ce(t,oe("inline text-xl font-bold",e.data.unusable&&"text-red-400"))),r})(),as=e=>(()=>{var r=Hi(),t=r.firstChild,n=t.nextSibling;return C(t,I(me,{get each(){return e.data.baseStats},children:(o,i)=>[I(qe,{get when(){return i()>0},get children(){return Xi()}}),(()=>{var l=Yi(),s=l.firstChild;return C(s,o),X(a=>te(s,"color",to(o))),l})()]})),C(n,()=>e.data.baseStats.reduce((o,i)=>o+i,0)),r})(),cs=e=>(()=>{var r=Zi();return C(r,I(me,{get each(){return e.data.abilities},children:t=>(()=>{var n=Ji();return C(n,t),n})()})),r})();Ke(["click"]);var ds=D('<div class="flex flex-col gap-1 p-1 pt-0"><div class="flex gap-1"><label for=sig-item class="flex cursor-pointer items-center justify-center text-white/70">Item</label></div><div class="flex gap-1"></div><div class="flex gap-1"></div><div class="grid grid-cols-2 gap-1"></div><div class="flex gap-1"></div><div class="text-center text-sm font-bold"><div>Click the Pokemon to see their changes on the Doozdex!'),us=D("<div>"),fs=D('<div class="flex gap-1">'),ps=D('<div class="dz-family-line pointer-events-none absolute right-0 left-0"style=z-index:50>'),hs=D('<div class="relative h-full">'),ms=D(`<div class="flex h-full flex-col items-center justify-center border-b text-center"><div class="text-xs font-bold"></div><div class=text-xs>To see full effects of the item, click the Pokemon's icon!`),gs=D("<input type=checkbox>");const bs=[{label:"#",value:"num"},{label:"A-Z",value:"a-z"},{label:"HP",value:"hp"},{label:"Atk",value:"atk"},{label:"Def",value:"def"},{label:"SpA",value:"spa"},{label:"SpD",value:"spd"},{label:"Spe",value:"spe"},{label:"BST",value:"bst"}],xs=e=>{Be(()=>Mt()[1](null));const r=Yt(),t=it(),n=bn(),o=Mi(),[i,l]=N(""),[s,a]=N(["",""]),[c,d]=N("num"),[u,h]=N(!1),[f,m]=N(["","",""]),[x,w]=N(!1),[E,b]=N([["",!0],["",!0],["",!0],["",!0]]);let k;const _=V(()=>{const y=t();if(!y)return[{value:"",label:"—"}];const S=new Set;for(const L of Object.values(y)){const T=L.abilities;for(let $=0;$<T.length;$++)S.add(T[$])}const g=Array.from(S).sort((L,T)=>L.localeCompare(T)),M=Array.from({length:g.length+1});M[0]={value:"",label:"(Ability)"};for(let L=0;L<g.length;L++){const T=g[L];M[L+1]={value:T,label:T}}return M}),v=V(()=>{var T;const y=t(),S=n();if(!y)return[{value:"",label:"—"}];const g=new Set;for(const $ of Object.values(y)){const F=Object.values($.learntMoves);for(let G=0;G<F.length;G++)g.add(F[G][0])}const M=Array.from(g).sort(($,F)=>$.localeCompare(F)),L=Array.from({length:M.length+1});L[0]={value:"",label:"(Move)"};for(let $=0;$<M.length;$++){const F=M[$];L[$+1]={value:F,label:S&&((T=S[K(F)])==null?void 0:T.name)||F}}return L}),R=V(()=>{var He;const y=t();if(!y)return[];const S=r(),g=vt.find(B=>B.value===S),M=K(i()),L=s(),T=new Set(L).size===1,$=f().filter(Boolean),F=E(),G=[],Y=[],ne=x(),z=c();for(const B of Object.values(y)){const W=K(B.name);if(M&&!W.includes(M)&&!(B.oldNames??[]).some(J=>K(J).includes(M)))continue;let U=!0;for(let J=0;J<L.length;J++){const q=L[J];if(q&&(!B.types.includes(q)||T&&B.types.length!==1)){U=!1;break}}if(!U)continue;let de=!0;for(let J=0;J<F.length;J++){const[q,Oe]=F[J];if(!q)continue;const fe=B.learntMoves.find(pe=>pe[0]===q);if(Oe?!fe:fe){de=!1;break}}if(de&&!(ne&&!(g!=null&&g.signatureItems[W])))if($.length>0){const J=g==null?void 0:g.signatureItems[W],q=J&&((He=g==null?void 0:g.magicItems[J])==null?void 0:He.abilities)||[];let Oe=!0,fe=!1;for(let pe=0;pe<$.length;pe++){const Te=$[pe];if(!B.abilities.includes(Te)){if(q.includes(Te)){fe=!0;continue}Oe=!1;break}}if(!Oe)continue;!fe||z!=="a-z"&&z!=="num"?G.push(B):Y.push(B)}else G.push(B)}const ie=(B,W)=>{let U=0;switch(z){case"a-z":U=B.name.localeCompare(W.name);break;case"num":U=(B.dexOrder??1e4+B.num)-(W.dexOrder??1e4+W.num);break;case"hp":U=W.baseStats[0]-B.baseStats[0];break;case"atk":U=W.baseStats[1]-B.baseStats[1];break;case"def":U=W.baseStats[2]-B.baseStats[2];break;case"spa":U=W.baseStats[3]-B.baseStats[3];break;case"spd":U=W.baseStats[4]-B.baseStats[4];break;case"spe":U=W.baseStats[5]-B.baseStats[5];break;case"bst":U=W.baseStats.reduce((de,J)=>de+J,0)-B.baseStats.reduce((de,J)=>de+J,0);break}return U*(u()?-1:1)};G.sort(ie),Y.sort(ie);const ge=G.map((B,W)=>({type:"item",data:B,famStart:z==="num"&&W>0&&B.family!==G[W-1].family}));if(z==="num"&&!u()){const B=G.find(W=>K(W.name)==="ditto");B&&G.length>1&&(ge[0]&&(ge[0].famStart=!0),ge.unshift({type:"item",data:B}))}if(Y.length>0){ge.push({type:"header",label:`Gains the effects of ${$.join("/")} via a signature item`});for(const B of Y)ge.push({type:"item",data:B})}return ge}),P=Xt({get count(){var y;return((y=R())==null?void 0:y.length)??0},getScrollElement:()=>k,estimateSize:()=>52}),p=V(()=>Object.keys({...t()}).toSorted());return[(()=>{var y=ds(),S=y.firstChild,g=S.firstChild,M=S.nextSibling,L=M.nextSibling,T=L.nextSibling,$=T.nextSibling;return C(S,I(xn,{get value(){return i()},oninput:F=>l(K(F.currentTarget.value)),get autocompleteList(){return p()},placeholder:"Search..."}),g),C(S,I(Sr,{id:"sig-item",get checked(){return x()},onchange:F=>w(!!F.currentTarget.checked)}),null),C(M,I(ft,{get each(){return s()},children:(F,G)=>I(ye,{get options(){return wt.toSorted((Y,ne)=>Y.label.localeCompare(ne.label))},get value(){return F()},oninput:Y=>a(ne=>{const z=[...ne];return z[G]=Y.currentTarget.value,z})})})),C(L,I(ft,{get each(){return f()},children:(F,G)=>I(ye,{get options(){return _()},get value(){return F()},oninput:Y=>m(ne=>{const z=[...ne];return z[G]=Y.currentTarget.value,z})})})),C(T,I(ft,{get each(){return E()},children:(F,G)=>(()=>{var Y=fs();return C(Y,I(Sr,{get checked(){return F()[1]},onchange:ne=>b(z=>{const ie=[...z];return ie[G]=[ie[G][0],ne.currentTarget.checked],ie})}),null),C(Y,I(ye,{get options(){return v()},get value(){return F()[0]},oninput:ne=>b(z=>{const ie=[...z];return ie[G]=[ne.currentTarget.value,!0],ie})}),null),Y})()})),C($,I(me,{each:bs,children:F=>I(Ht,{get class(){return oe("flex-1 text-sm",c()===F.value&&"font-bold")},onclick:()=>c()===F.value?h(G=>!G):d(F.value),get children(){return F.label}})})),y})(),(()=>{var y=us();return Et(S=>k=S,y),C(y,I(Zt,{class:"border-x",virtualizer:P,get items(){return R()},children:S=>S.type==="item"?(()=>{var g=hs();return C(g,I(qe,{get when(){return S.famStart},get children(){return ps()}}),null),C(g,I(os,{get data(){return S.data},get datasetId(){return e.datasetId},get sheetId(){return o()}}),null),g})():(()=>{var g=ms(),M=g.firstChild;return C(M,()=>S.label),g})()})),X(()=>ce(y,oe("flex-auto overflow-auto",R().length>0&&"border-t"))),y})()]};function Sr(e){const[r,t]=At(e,["class"]);return(()=>{var n=gs();return Ct(n,Ce({get class(){return Pt("h-4 w-4 flex-none cursor-pointer appearance-none self-center rounded-xs border border-white","flex items-center justify-center","bg-red-500 before:content-['✕']","checked:bg-green-500 checked:text-black checked:before:content-['✓']",r.class)}},t),!1,!1),n})()}var ys=D('<div class="absolute inset-0 z-10 backdrop-blur-md backdrop-brightness-80"><div class="absolute inset-4 flex flex-col rounded border-x border-t bg-black shadow"><div class="flex h-8 shrink-0 border-b"><div class="flex flex-auto items-center px-2 font-bold"></div><div class="flex aspect-square cursor-pointer items-center justify-center border-l">X</div></div><div class="relative flex-auto overflow-auto">'),vs=D('<div><div class="w-10 border-r text-center"></div><div class="aspect-4/3 h-full"style="background-size:auto 100%;background-repeat:no-repeat;background-position:right;image-rendering:pixelated;transform:scaleX(-1)"></div><div>'),ws=D("<span><span class=text-xs>Lv"),ks=D('<img class="mx-auto h-full py-0.5">');function Ss(e){const r=it(),t=K(e.move),n=V(()=>{const l=r();return l?Object.values(l).filter(s=>s.learntMoves.find(a=>!s.unusable&&K(a[0])===t)).map(s=>[s,s.learntMoves.find(a=>K(a[0])===t)[1]]).toSorted(([,s],[,a])=>{const c=typeof s=="number",d=typeof a=="number";return c&&d?s-a:c?-1:d?1:0}):[]});let o;const i=Xt({get count(){return n().length},getScrollElement:()=>o,estimateSize:()=>26});return(()=>{var l=ys(),s=l.firstChild,a=s.firstChild,c=a.firstChild,d=c.nextSibling,u=a.nextSibling;return yt(l,"click",e.close,!0),s.$$click=h=>h.stopPropagation(),C(c,()=>e.move),yt(d,"click",e.close,!0),Et(h=>o=h,u),C(u,I(Zt,{virtualizer:i,get items(){return n()},children:([h,f])=>(()=>{var m=vs(),x=m.firstChild,w=x.nextSibling,E=w.nextSibling;return m.$$click=()=>h.range&&yn(h.range),C(x,f===0?"–":typeof f=="number"?(()=>{var b=ws();return b.firstChild,C(b,f,null),b})():(()=>{var b=ks();return X(()=>Ge(b,"src",`${globalThis.__DZ_BASE}icons/${f}.webp`)),b})()),C(E,()=>h.name),X(b=>{var k=Pt("flex h-full border-b",h.range&&"cursor-pointer"),_=`url(${globalThis.__DZ_BASE}calcsprites/${K(h.name)}.png), url(${globalThis.__DZ_BASE}sprites/${K(h.name)}.png)`;return k!==b.e&&ce(m,b.e=k),_!==b.t&&te(w,"background-image",b.t=_),b},{e:void 0,t:void 0}),m})()})),l})()}Ke(["click"]);const _s="_info_llwgs_5",zs="_desc_llwgs_21",_r={info:_s,desc:zs};var Os=D("<div class=group-hover:hidden>📌"),Is=D('<div class="hidden group-hover:block">X'),As=D('<div class="z-10 flex h-full flex-col border-b"><div><div class="h-full w-6.5 border-r border-b"></div><div class="aspect-square h-full bg-contain bg-center bg-no-repeat"></div><div class="flex-auto text-center font-bold text-nowrap"></div><div class="w-10 text-center font-bold"></div><div class="w-10 text-center">%</div><div class="w-10 text-center"><span class=text-[10px]>PP</span></div><div class="relative h-full w-4 cursor-pointer"><div class="group absolute h-full w-7 -translate-x-1 text-center"></div></div></div><div>'),Cs=D('<div class="hidden group-hover:block">📌');const Es=e=>(()=>{var r=As(),t=r.firstChild,n=t.firstChild,o=n.nextSibling,i=o.nextSibling,l=i.nextSibling,s=l.nextSibling,a=s.firstChild,c=s.nextSibling,d=c.firstChild,u=c.nextSibling,h=u.firstChild,f=t.nextSibling;return yt(r,"contextmenu",e.open,!0),C(n,I(Jt,{get type(){return e.data.type}})),C(i,()=>e.data.name),C(l,()=>e.data.power||"—"),C(s,(()=>{var m=Rr(()=>e.data.acc===101);return()=>m()?"—":e.data.acc})(),a),C(c,()=>e.data.pp,d),h.$$click=m=>{m.stopPropagation(),e.pinUnpin()},C(h,I(qe,{get when(){return e.pinned},get fallback(){return Cs()},get children(){return[Os(),Is()]}})),C(f,()=>e.data.desc),X(m=>{var x=Dr[e.data.type]??"#999",w=oe("relative flex h-6.5 items-center gap-2 pr-2 text-[14px]",_r.info),E=`url(${globalThis.__DZ_BASE}icons/${e.data.category}.webp)`,b=e.data.zPower?`Z-Move power: ${e.data.zPower}`:"",k=oe("relative flex flex-auto items-center px-1 text-center text-[10px] font-bold",_r.desc);return x!==m.e&&te(r,"--tc",m.e=x),w!==m.t&&ce(t,m.t=w),E!==m.a&&te(o,"background-image",m.a=E),b!==m.o&&Ge(l,"title",m.o=b),k!==m.i&&ce(f,m.i=k),m},{e:void 0,t:void 0,a:void 0,o:void 0,i:void 0}),r})();Ke(["contextmenu","click"]);var Ms=D('<div class="flex flex-col gap-1 p-1 pt-0"><div class="flex gap-1"></div><div class="flex gap-1">'),Ps=D('<div class="flex flex-col pb-1 text-center text-xs text-white/70 italic"><div>Click top-right corner of a move to pin or unpin it</div><div>Right-click to show Pokémon that learn that move'),Ts=D('<div class="relative flex flex-auto overflow-hidden border-t"><div>');const $s=[{label:"#",value:"num"},{label:"A-Z",value:"a-z"},{label:"Power",value:"pow"},{label:"Acc",value:"acc"}];function Fs(){const e=Yt(),r=bn(),t=it(),[n,o]=Gr(),i=V(()=>{const p=new Set,y=t();if(!y)return p;for(const S of Object.values(y))for(const g of S.learntMoves)p.add(K(g[0]));return p}),[l,s]=N(""),[a,c]=N(""),[d,u]=N(""),h=V(()=>Object.values(t()??{}).map(p=>p.name).toSorted()),f=V(()=>{var L;const p=K(l()),y=t();if(!p||!y)return;if(y[p])return y[p];const S=Object.entries(y),g=S.find(([,T])=>(T.oldNames??[]).some($=>K($)===p));return g?g[1]:p.length<3||(L=S.filter(([T])=>T.startsWith(p)).sort((T,$)=>T[0].length-$[0].length||T[0].localeCompare($[0]))[0])==null?void 0:L[1]}),m=V(()=>{var T;const p=r();if(!p)return[];n();const y=K(l()),S=a(),g=d(),M=(T=f())==null?void 0:T.learntMoves,L=i();return Object.values(p).filter($=>{const F=K($.name);return!(!L.has(F)||y&&!(M!=null&&M.find(G=>K(G[0])===F))&&!F.includes(y)||S&&$.type!==S||g&&$.category!==g)})}),[x,w]=N("num"),[E,b]=N(!1),k=V(()=>{var g;const p=x(),y=new Set(n()),S=(g=f())==null?void 0:g.learntMoves;return m().toSorted((M,L)=>{const T=y.has(M.name);if(T!==y.has(L.name))return T?-1:1;let $=0;const F=S==null?void 0:S.find(Y=>K(Y[0])===K(M.name)),G=S==null?void 0:S.find(Y=>K(Y[0])===K(L.name));if(F&&G)return S.indexOf(F)-S.indexOf(G);if(F)return-1;if(G)return 1;switch(p){case"a-z":$=M.name.localeCompare(L.name);break;case"num":$=M.num-L.num;break;case"pow":$=L.power-M.power;break;case"acc":$=L.acc-M.acc;break}return $*(E()?-1:1)})}),[_,v]=N("");let R;const P=Xt({get count(){return k().length},getScrollElement:()=>R,estimateSize:()=>71});return[(()=>{var p=Ms(),y=p.firstChild,S=y.nextSibling;return C(p,I(xn,{class:"flex-3",get value(){return l()},oninput:g=>s(g.currentTarget.value),get suggest(){return h()},onPick:g=>s(g),placeholder:"Search..."}),y),C(y,I(ye,{get options(){return wt.toSorted((g,M)=>g.label.localeCompare(M.label))},get value(){return a()},oninput:g=>c(g.currentTarget.value)}),null),C(y,I(ye,{options:ro,get value(){return d()},oninput:g=>u(g.currentTarget.value)}),null),C(S,I(me,{each:$s,children:g=>I(Ht,{get class(){return oe("flex-1 text-sm",x()===g.value&&"font-bold")},onclick:()=>x()===g.value?b(M=>!M):w(g.value),get children(){return g.label}})})),p})(),Ps(),(()=>{var p=Ts(),y=p.firstChild;return C(p,I(qe,{get when(){return _()},get children(){return I(Ss,{get move(){return _()},close:()=>v(""),get datasetId(){return e()}})}}),y),Et(S=>R=S,y),C(y,I(Zt,{class:"border-x",virtualizer:P,get items(){return k()},children:S=>I(Es,{data:S,pinUnpin:()=>{o(g=>{const M=new Set(g);return M.has(S.name)?M.delete(S.name):M.add(S.name),M})},get pinned(){return n().has(S.name)},open:()=>v(S.name)})})),X(()=>ce(y,Pt("w-full flex-auto",_()?"overflow-hidden":"overflow-auto"))),p})()]}var Rs=D('<div class="flex flex-col gap-1 p-1"><div class="flex gap-1"></div><div class="flex gap-1"></div><div class="grid grid-cols-9 gap-1">'),Ls=D('<div class="flex aspect-2/3 flex-col overflow-hidden rounded-xs border"><div class="flex-1 border-b"></div><div class="flex flex-1 items-center justify-center text-xs font-bold">');const Ds={8:"#4adaff",4:"#73D216",3:"#4E9A06",2:"#4E9A06",1.5:"#4E9A06",1:"color-mix(in srgb, var(--color-white) 7%, var(--color-black))",.5:"#A40000",.25:"#7C0000",.125:"#3d0a00",0:"#000"},js=()=>{const e=Yt(),r=V(()=>{const _=e();return vt.find(v=>v.value===_)}),t=it(),[n]=Mt(),o=V(()=>{const _=t();return _?Object.values(_).map(v=>v.name).toSorted():[]}),[i,l]=N("");Be(()=>{const _=n();_&&l(_)}),tt(()=>{const _=t(),v=i(),R=_&&_[K(v)],P=r();if(!v||!R||!P)return;a([R.types[0],R.types[1]??""]);const p=new Set;for(const g of R.abilities)g&&p.add(g);const y=P.signatureItems[K(R.name)],S=y&&P.tcItems.includes(y)&&(!P.tciOnlyIf[y]||P.tciOnlyIf[y].includes(R.name));S&&p.add(y),m(p),S&&h(y);for(const g of R.abilities)if(g&&P.tcAbilities.includes(g)){d(g);break}});const[s,a]=N(["",""]),[c,d]=N(""),[u,h]=N(""),[f,m]=N(new Set),x=(_,v)=>_.length===v.length&&_.every((R,P)=>R.value===v[P].value),w=V(()=>{var _;return[{label:"(Ability)",value:""},...((_=r())==null?void 0:_.tcAbilities.filter(v=>!i()||f().has(v)).toSorted().map(v=>({label:v,value:v})))??[]]},[{label:"(Ability)",value:""}],{equals:x}),E=V(()=>{var _;return[{label:"(Item)",value:""},...((_=r())==null?void 0:_.tcItems.filter(v=>!i()||f().has(v)).toSorted().map(v=>({label:v,value:v})))??[]]},[{label:"(Ability)",value:""}],{equals:x}),b=V(()=>{const _=r();if(!_)return{};const[v,R]=s(),P={};let p=1,y=!1;const S=(g,M=!1)=>{const L=_.typeChart[g];for(const T in L){const $=L[T];if(!($===void 0||$===1)){if(T==="Super Effective"){p*=$,M&&(y=!0);continue}P[T]??(P[T]=[1,!1]),P[T][0]*=$,M&&(P[T][1]=!0)}}};for(const g of[v,R])g&&S(g);for(const g of[c(),u()])g&&S(g,!0);if(p!==1)for(const g in P)P[g][0]>1&&(P[g][0]*=p,y&&(P[g][1]=!0));return P}),k=V(()=>{const _=b();return wt.slice(1).map((v,R)=>{var P;return{t:v,i:R,x:((P=_[v.value])==null?void 0:P[0])??1}}).sort((v,R)=>R.x-v.x||v.i-R.i).map(v=>v.t)});return(()=>{var _=Rs(),v=_.firstChild,R=v.nextSibling,P=R.nextSibling;return C(_,I(ye,{get options(){return[{label:"(Pokemon)",value:""},...o().map(p=>({label:p,value:p}))??[]]},get value(){return i()},oninput:p=>l(p.currentTarget.value)}),v),C(v,I(ft,{get each(){return s()},children:(p,y)=>I(ye,{get options(){return wt.toSorted((S,g)=>S.label.localeCompare(g.label))},get value(){return p()},oninput:S=>{a(g=>{const M=[...g];return M[y]=S.currentTarget.value,M}),l("")}})})),C(R,I(ye,{get options(){return w()},get value(){return c()},oninput:p=>d(p.currentTarget.value)}),null),C(R,I(ye,{get options(){return E()},get value(){return u()},oninput:p=>h(p.currentTarget.value)}),null),C(P,I(me,{get each(){return k()},children:p=>{const y=()=>{var g;return((g=b()[p.value])==null?void 0:g[0])??1},S=()=>{var g;return((g=b()[p.value])==null?void 0:g[1])??!1};return(()=>{var g=Ls(),M=g.firstChild,L=M.nextSibling;return C(M,I(Jt,{get type(){return p.value}})),C(L,y,null),C(L,()=>S()&&"*",null),X(T=>{var $=Ds[y()],F={0:"#f44",1:"color-mix(in srgb, var(--color-white) 70%, var(--color-black))"}[y()];return $!==T.e&&te(L,"background",T.e=$),F!==T.t&&te(L,"color",T.t=F),T},{e:void 0,t:void 0}),g})()}})),_})()};var Ns=D('<div class="mx-auto flex h-dvh w-full flex-col bg-black text-white select-none"><div class="flex h-8 shrink-0 gap-1 p-1"></div><div class="flex flex-auto flex-col overflow-hidden">');const Gs=()=>{const[e,r]=N(vt[0].value),[t,n]=N(!1),[o,i]=N("pokedex"),[l,s]=N(vt[0].value),[,a]=Gr(),c=it(),d=lo(),u=Mt()[0];Be(async()=>{try{const f=await ee.getItem(se.datasetId);f&&typeof f=="string"&&(r(f),s(f));const m=await ee.getItem("session:screen");m&&typeof m=="string"&&i(m)}catch(f){console.error("Failed to load data from storage:",f)}});const h=()=>{const f=e();n(!0),Le.runtime.sendMessage({action:"updateData",datasetId:f}).then(async()=>{await ee.setItem(se.datasetId,f),s(f),n(!1),a(new Set)}).catch(console.error)};return tt(()=>d()&&c()===null&&h()),tt(()=>{u()&&(i("moves"),ee.setItem("session:screen","moves"))}),(()=>{var f=Ns(),m=f.firstChild,x=m.nextSibling;return f.addEventListener("dragstart",w=>w.preventDefault()),f.$$contextmenu=w=>w.preventDefault(),C(m,I(me,{each:eo,children:w=>I(Ht,{class:"flex-1",onClick:()=>{i(w.value),ee.setItem("session:screen",w.value)},get disabled(){return o()===w.value},get children(){return w.label}})})),C(x,I(Ln,{get children(){return[I(Qt,{get when(){return o()==="pokedex"},get children(){return I(xs,{get datasetId(){return l()}})}}),I(Qt,{get when(){return o()==="moves"},get children(){return[I(Fs,{}),I(js,{})]}})]}})),f})()},Ws=()=>I(so,{get children(){return I(io,{get children(){return I(Gs,{})}})}});Ke(["contextmenu"]);const kn=()=>{let e=!0;try{window.parent!==window&&(e=window.parent.document.body.classList.contains("dark"))}catch{}document.documentElement.dataset.theme=e?"dark":"light"};kn();try{window.parent!==window&&new MutationObserver(kn).observe(window.parent.document.body,{attributes:!0,attributeFilter:["class"]})}catch{}qn(()=>I(Ws,{}),document.getElementById("root"));
