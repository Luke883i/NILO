// NILO contracts: source-bound negative predicates, no self-issued PASS or release authority.
import {readFileSync, existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {validateBridge} from "./verify-development.mjs";
import {validateIterationHypothesis} from "./semantic-campaign.mjs";
import {CFG,PLATFORMS} from "../web/core.mjs";
import {LV01_ENTITY_BLUEPRINT,validateActionBlueprint,spawnActionEntities} from "../web/action.mjs";
import {GOLDEN_MINUTE,goldenMinutePlan,GOLDEN_MOTION,goldenMotionPose} from "../web/golden-minute.mjs";
import {describeLevel,IMPLEMENTED_LEVEL_IDS,DESIGN_ONLY_LEVEL_IDS} from "../web/levels/catalog.mjs";
import {LV02,lv02Surfaces,currentForceAt,decodeLV02Checkpoint} from "../web/levels/lv-02.mjs";
import {ART_CUES,ART_SIGNALS,ART_IDENTITY} from "../web/art.mjs";
import {CUSTODE,initialCustode,enterCustode,advanceCustode} from "../web/levels/custode.mjs";
import {LV03,archiveDoorOpen,decodeLV03Checkpoint} from "../web/levels/lv-03.mjs";
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const raw=p=>JSON.parse(readFileSync(resolve(ROOT,p),"utf8"));
export const load=()=>({
  contract:raw("contracts/nilo-semantic-v1.json"),
  dod:raw("contracts/dod-v1.json"),
  chain:raw("provenance/semantic-chain.json"),
  refs:raw("standards/references.json"),
  bom:raw("bom/nilo.cdx.json"),
  pkg:raw("package.json"),
  bridge:raw("contracts/development-map.json")
});
const distinct=xs=>new Set(xs).size===xs.length;
export function audit({contract,dod,chain,refs,bom,pkg,bridge}) {
  const errors=[];
  const fail=(id,cond)=>{if(!cond)errors.push(id);};
  fail("contract-schema",contract?.schema==="nilo.semantic-contract/1");
  fail("contract-author-approval",contract?.authority==="DRAFT_CREATIVE_PROPOSAL_REQUIRES_AUTHOR_REVIEW"
    && contract.goal?.human_approved===false);
  fail("story-identity",Boolean(contract?.story?.theme&&contract?.story?.premise&&contract?.story?.ending));
  const feel=contract?.gameplay?.game_feel;
  fail("game-feel-source-drift",feel?.id==="I02"&&
    feel.coyote_ticks===CFG.coyoteTicks&&feel.buffer_ticks===CFG.bufferTicks&&
    feel.short_hop_velocity_multiplier===CFG.jumpReleaseMultiplier&&
    feel.external_player_acceptance==="BLOCKED_EXTERNAL");
  fail("game-feel-input-continuity",feel?.input_continuity?.event_model?.includes("fixed tick")&&
    feel.input_continuity.transient_short_press?.includes("preserved")&&
    feel.input_continuity.buffered_short_hop_max_apex_delta_px===10&&
    feel.input_continuity.user_experience_approval==="BLOCKED_EXTERNAL"&&
    feel.input_continuity.native_browser_witness==="tests/browser-e2e.py must run against exact PR SHA");
  const visual=contract?.gameplay?.visual_scene;
  fail("visual-scene-source-drift",
    visual?.id==="I03-I05-LV01-VISUAL-NARRATIVE-CANDIDATE"&&
    visual?.status==="IMPLEMENTED_SOURCE_CANDIDATE_NOT_HUMAN_ACCEPTED"&&
    visual?.scaled_integer_factor===2&&
    visual?.resolution?.join("x")==="480x270"&&visual?.output_canvas?.join("x")==="960x540"&&
    visual?.art_cues?.join(",")===ART_CUES.map(x=>x.id).join(",")&&
    visual?.noncompensatory_signals?.join(",")===Object.keys(ART_SIGNALS).join(",")&&
    visual?.character_roles?.join(",")===[ART_IDENTITY.playable,ART_IDENTITY.companion,ART_IDENTITY.maintenance].join(",")&&
    visual?.player_visual_comprehension==="BLOCKED_EXTERNAL"&&
    visual?.aesthetic_author_approval==="NOT_OBSERVED"&&
    visual?.screen_reader_qualification==="NOT_OBSERVED"&&
    visual?.mobile_touch_qualification==="EXPLICITLY_UNSUPPORTED");
  const canal=contract?.gameplay?.lv02,lev=contract?.levels?.find(x=>x.id==="LV-02");
  fail("lv02-real-level-source-boundary",
   canal?.id==="I06"&&canal?.level_owner==="web/levels/lv-02.mjs"&&
   canal?.shared_logic==="web/core.mjs"&&canal?.shared_view==="web/art.mjs"&&
   canal?.status==="IMPLEMENTED_CANDIDATE_NOT_PLAYER_ACCEPTED"&&
   canal?.checkpoint_key==="nilo.checkpoint.lv02.v1"&&canal?.moving_platform===LV02.moving.id&&
   canal?.currents?.join(",")===LV02.currents.map(x=>x.id).join(",")&&
   canal?.boss==="CH-CUSTODE IMPLEMENTED_CANDIDATE"&&canal?.second_hour==="VICTORY_ONLY"&&
   canal?.player_acceptance==="BLOCKED_EXTERNAL"&&
   canal?.browser_oracle==="tests/browser-lv-02.py"&&
   lev?.design_status==="IMPLEMENTED_LEVEL_AND_BOSS_CANDIDATE_NOT_PLAYER_ACCEPTED"&&
   lev?.acceptance_oracles?.length===6&&lev?.exit?.includes("restoring second hour only on VICTORY")&&
   lv02Surfaces(100).some(p=>p.moving)&&currentForceAt(620)===52&&currentForceAt(1680)===-38&&
   decodeLV02Checkpoint('{"version":1,"level":"LV-01","checkpointId":"CP-02"}')===null);
  const keeper=contract?.gameplay?.custode;
  fail("custode-source-state-boundary",
    keeper?.id==="I07"&&keeper?.owner==="web/levels/custode.mjs"&&
    keeper?.status==="IMPLEMENTED_CANDIDATE_NOT_PLAYER_ACCEPTED"&&
    keeper?.telegraph_ticks===CUSTODE.telegraphTicks&&keeper?.strike_ticks===CUSTODE.strikeTicks&&
    keeper?.recovery_ticks===CUSTODE.recoveryTicks&&
    keeper?.required_repairs===CUSTODE.requiredRepairs&&keeper?.max_hits===CUSTODE.maxHits&&
    keeper?.second_hour==="VICTORY_ONLY"&&keeper?.player_acceptance==="BLOCKED_EXTERNAL"&&
    keeper?.browser_oracle==="tests/browser-custode.py"&&
    enterCustode(initialCustode()).phase==="TELEGRAPH"&&
    advanceCustode(initialCustode(),{repairPressed:true,grounded:true,nearMechanism:true}).repairs===0);
  const a=contract?.gameplay?.lv03,l=contract?.levels?.find(x=>x.id==="LV-03");
  fail("lv03-boundary",a?.id==="I08"&&a?.status==="IMPLEMENTED_CANDIDATE_NOT_PLAYER_ACCEPTED"&&
    a?.level_owner==="web/levels/lv-03.mjs"&&a?.checkpoint_key==="nilo.checkpoint.lv03.v1"&&
    a?.doors?.join(",")===LV03.doors.map(x=>x.id).join(",")&&
    a?.modes?.join(",")==="LIGHT,SHADOW"&&
    a?.third_hour==="TWO_DOORS_AND_GROUNDED_EXIT_ONLY"&&
    a?.player_acceptance==="BLOCKED_EXTERNAL"&&a?.beta_authorized===false&&
    a?.browser_oracle==="tests/browser-lv-03.py"&&
    l?.design_status==="IMPLEMENTED_CANDIDATE_NOT_PLAYER_ACCEPTED"&&l?.acceptance_oracles?.length===6&&
    archiveDoorOpen(LV03.doors[0],"LIGHT")===false&&archiveDoorOpen(LV03.doors[0],"SHADOW")&&
    archiveDoorOpen(LV03.doors[1],"LIGHT")&&archiveDoorOpen(LV03.doors[1],"SHADOW")===false&&
    decodeLV03Checkpoint('{"version":1,"level":"LV-02","checkpointId":"CP-03"}')===null);
  const chars=contract?.characters||[],levels=contract?.levels||[];
  const charIds=chars.map(x=>x.id),levelIds=levels.map(x=>x.id);
  fail("characters",chars.length===6&&distinct(charIds)&&chars.every(x=>x.name&&x.role&&x.motivation&&x.silhouette));
  fail("levels",levels.length===6&&distinct(levelIds)&&levels.every((x,i)=>x.id==="LV-"+String(i+1).padStart(2,"0")&&x.title&&x.story&&x.mechanics?.length));
  const bosses=levels.filter(x=>x.boss).map(x=>x.boss);
  fail("boss-mapping",bosses.length===3&&distinct(bosses)&&bosses.every(x=>charIds.includes(x))&&
    levels[1]?.boss==="CH-CUSTODE"&&levels[3]?.boss==="CH-ARCHIVISTA"&&levels[5]?.boss==="CH-DIRETTORE");
  fail("slice-oracles",contract?.slice?.acceptance_oracles?.length>=6&&distinct(contract.slice.acceptance_oracles.map(x=>x.id))&&
    contract.slice.acceptance_oracles.some(x=>x.type==="REAL_SOURCE_MUTATION"));
  fail("effects",contract?.gameplay?.security?.includes("no telemetry")&&contract?.permissions?.not_allowed?.includes("release"));
  fail("dod-shape",dod?.schema==="nilo.reticular-dod/1"&&dod?.root==="G_CONTRACT_DEMONSTRATED"&&
    dod?.seed_goal==="G_SEED_SOURCE"&&dod?.beta_goal==="G_BETA_RELEASE"&&dod?.authority==="NONE"&&dod?.nodes?.length===104);
  const ids=(dod?.nodes||[]).map(n=>n.id),nodes=new Map((dod?.nodes||[]).map(n=>[n.id,n]));
  fail("dod-identities",distinct(ids));
  fail("dod-AND",Array.from(nodes.values()).filter(n=>n.kind==="AND").length===19&&
    nodes.get("G_CONTRACT_DEMONSTRATED")?.depends_on?.join(",")==="G_BETA_RELEASE,G_SUPPLY_CHAIN,G_RELEASE"&&
    nodes.get("G_BETA_RELEASE")?.depends_on?.join(",")==="G_FULL_GAME,Q01,Q02,Q03,Q04,Q05,Q06,Q07"&&
    nodes.get("G_RELEASE")?.depends_on?.join(",")==="R01,R02,R03,G_DELIVERY_PR11"&&
    nodes.get("G_DELIVERY_PR11")?.depends_on?.join(",")==="G_CODESPACES_P0,G_RENDER_P1"&&
    nodes.get("G_CODESPACES_P0")?.depends_on?.join(",")==="DL01,DL02,DL03,DL04"&&
    nodes.get("G_RENDER_P1")?.depends_on?.join(",")==="DL05,DL06,DL07,DL08"&&
    nodes.get("G_FULL_GAME")?.depends_on?.includes("G_LV03_PR12")&&
    nodes.get("G_FULL_GAME")?.depends_on?.includes("G_LV01_ACTION_S01")&&
    nodes.get("G_FULL_GAME")?.depends_on?.includes("G_CREATIVE_A0_S02")&&
    nodes.get("G_FULL_GAME")?.depends_on?.includes("G_WORLD_CATALOG_S03")&&
    nodes.get("G_FULL_GAME")?.depends_on?.includes("G_ACTION_ENTITIES_S03B")&&
    nodes.get("G_FULL_GAME")?.depends_on?.includes("G_GOLDEN_MINUTE_V0")&&
    nodes.get("G_FULL_GAME")?.depends_on?.includes("G_GOLDEN_MOTION_V1")&&
    nodes.get("G_LV03_PR12")?.depends_on?.join(",")==="L3_00,L3_01,L3_02,L3_03,L3_04,L3_05,L3_06,L3_07,L3_08");
  const actionLeafIds=["A7_00","A7_01","A7_02","A7_03","A7_04"];
  fail("s01-action-gate",nodes.get("G_LV01_ACTION_S01")?.kind==="AND"&&
    nodes.get("G_LV01_ACTION_S01")?.depends_on?.join(",")==actionLeafIds.join(",")&&
    nodes.get("G_LV01_ACTION_S01")?.authorization==="NONE"&&
    nodes.get("G_LV01_ACTION_S01")?.baseline_status==="BLOCKED"&&
    actionLeafIds.every(id=>nodes.get(id)?.kind==="LEAF"&&nodes.get(id)?.witness===null&&
      nodes.get(id)?.baseline_status===(id==="A7_04"?"BLOCKED_EXTERNAL":"NOT_VERIFIED"))&&
    contract?.gameplay?.action_preview?.browser_oracle==="tests/browser-action.py"&&
    contract.gameplay.action_preview?.browser_http==="NOT_ATTESTED"&&
    contract.gameplay.action_preview?.playtest_accepted===false);
  const a0=contract?.next_a0;
  const a0Decisions=Array.isArray(a0?.decisions)?a0.decisions:[];
  const a0Worlds=Array.isArray(a0?.worlds)?a0.worlds:[];
  const a0Pillars=Array.isArray(a0?.pillars)?a0.pillars:[];
  const a0Exclusions=Array.isArray(a0?.exclusions)?a0.exclusions:[];
  fail("s02-a0-identity",a0?.schema==="nilo.creative-a0-candidate/1"&&
    a0?.id==="S02-NILO-NEXT"&&a0?.scope==="S02_DESIGN_CONTRACT_ONLY"&&
    a0?.status==="DRAFT_CREATIVE_PROPOSAL_REQUIRES_AUTHOR_REVIEW"&&
    a0?.owner==="NILO_PRODUCT_AUTHOR"&&
    a0?.approval?.human_approved===false&&a0.approval.approved_by===null&&
    a0.approval.approved_at===null&&a0.approval.approval_receipt===null&&
    contract?.goal?.human_approved===false&&contract?.story?.status==="PROPOSED_NOT_AUTHOR_APPROVED");
  fail("s02-a0-boundary",a0?.actors?.player==="NOVICE_DESKTOP_KEYBOARD_CANDIDATE"&&
    a0?.actors?.characters?.join(",")==="CH-NILO,CH-TICA,CH-PERNO"&&
    a0?.actors?.antagonists?.join(",")==="CH-CUSTODE,CH-ARCHIVISTA,CH-DIRETTORE"&&
    a0?.actors?.author==="NILO_PRODUCT_AUTHOR"&&
    a0?.behavior?.genre==="ORIGINAL_NARRATIVE_ACTION_PLATFORMER_2D"&&
    a0?.behavior?.levels===6&&a0?.behavior?.bosses===3&&
    ["ATTACK_J","JUMP","CONTEXT_E"].every(x=>a0?.behavior?.actions?.includes(x))&&
    a0?.behavior?.violence_boundary==="PENDING_AUTHOR_DECISION_DA02"&&
    a0?.state_data?.checkpoint==="LOCAL_RESUME_NOT_AUTHENTICATED_WIN"&&
    a0?.state_data?.progression==="PHYSICAL_COMPLETION_NOT_POSITION_ONLY"&&
    a0?.ux?.gameplay_enjoyment==="BLOCKED_EXTERNAL"&&
    a0?.ux?.a11y==="EQUIVALENCE_REQUIRES_EXPLICIT_QUALIFICATION"&&
    a0?.ux?.level_structure?.join(",")==="TEACH,TEST,TWIST,MASTER"&&
    a0?.effects?.outbound_telemetry===false&&a0.effects.backend===false&&
    a0?.effects?.original_assets_only_for_SHIPPING===true&&
    a0?.effects?.third_party_rights==="REVIEW_REQUIRED"&&
    a0?.effects?.age_rating==="UNASSESSED"&&
    a0?.effects?.privacy_and_monetization==="PENDING_AUTHOR_DECISION_DA09"&&
    ["NO_MARIO_CHARACTER_OR_GAME_ASSETS","NO_UNLICENSED_BRAND_APPROPRIATION",
     "NO_AUTOMATIC_CREATIVE_APPROVAL","NO_SIX_LEVEL_IMPLEMENTED_CLAIM",
     "NO_RELEASE_OR_DEPLOY_CLAIM"].every(x=>a0Exclusions.includes(x)));
  const decisionIds=["DA01","DA02","DA03","DA04","DA05","DA06","DA07","DA08","DA09"];
  fail("s02-a0-decisions",a0Decisions.length===decisionIds.length&&
    a0Decisions.map(x=>x.id).join(",")===decisionIds.join(",")&&
    a0Decisions.every(x=>x.topic?.length>4&&x.rationale?.length>15&&
      x.options?.length>=2&&new Set(x.options).size===x.options.length&&
      x.options.includes(x.recommended)&&x.selected===null&&
      x.status==="PENDING_AUTHOR_DECISION"&&x.authority==="NILO_PRODUCT_AUTHOR")&&
    a0?.review?.decisions_pending===9&&a0.review.creative_conflict_unresolved===true&&
    a0.review.approval_from_pr_or_ci===false&&a0.review.approval_from_score===false);
  fail("s02-a0-worlds",a0Worlds.length===levels.length&&
    a0Worlds.every((w,i)=>w.level_id===levels[i]?.id&&
      w.boss_id===(levels[i]?.boss??null)&&w.environment_id?.length>8&&
      w.mechanic_signature?.length>8&&w.implementation_claim==="CANDIDATE_SCOPE_ONLY")&&
    new Set(a0Worlds.map(w=>w.environment_id)).size===6);
  fail("s02-a0-pillars",a0Pillars.length===5&&
    a0Pillars.map(x=>x.problem_id).join(",")==="P1,P2,P3,P4,P5"&&
    new Set(a0Pillars.map(x=>x.id)).size===5&&
    a0Pillars.every(x=>x.player_promise?.length>15&&
      x.acceptance_evidence?.length>15&&x.design_status==="CANDIDATE_NOT_PLAYER_ACCEPTED"));
  fail("s02-a0-oracle",a0?.acceptance_oracle?.source==="tests/creative-a0-mutation.test.mjs"&&
    a0?.acceptance_oracle?.runtime==="TARGET_NATIVE_EVIDENCE_REQUIRED_LATER"&&
    a0?.acceptance_oracle?.external==="AUTHOR_APPROVAL_AND_INDEPENDENT_PLAYER_STUDY_REQUIRED"&&
    a0?.acceptance_oracle?.min_independent_novices_candidate===5&&
    a0?.acceptance_oracle?.all_pillars_noncompensatory===true&&
    a0?.acceptance_oracle?.quality_gate==="Q07"&&
    a0?.acceptance_oracle?.root_gate===dod?.root);
  const creativeLeafIds=["C2_00","C2_01","C2_02","C2_03","C2_04","C2_05","C2_06"];
  fail("s02-a0-gate",nodes.get("G_CREATIVE_A0_S02")?.kind==="AND"&&
    nodes.get("G_CREATIVE_A0_S02")?.depends_on?.join(",")===creativeLeafIds.join(",")&&
    nodes.get("G_CREATIVE_A0_S02")?.authorization==="NONE"&&
    nodes.get("G_CREATIVE_A0_S02")?.baseline_status==="BLOCKED"&&
    creativeLeafIds.every((id,i)=>nodes.get(id)?.kind==="LEAF"&&
      nodes.get(id)?.witness===null&&
      nodes.get(id)?.baseline_status===(i===0?"NOT_VERIFIED":"BLOCKED_EXTERNAL"))&&
    nodes.get("Q07")?.baseline_status==="BLOCKED_EXTERNAL");
  fail("s02-a0-document-owner",existsSync(resolve(ROOT,"docs/NILO_NEXT_S02_A0.md")));
  const technical=contract?.technical_s03;
  fail("s03-catalog-contract",technical?.schema==="nilo.engineering-s03a/1"&&
    technical?.id==="S03a-NILO-NEXT"&&
    technical?.status==="SOURCE_IMPLEMENTATION_CANDIDATE_NOT_HUMAN_ACCEPTED"&&
    technical?.target==="PRESERVE_EXISTING_THREE_LEVEL_GAMEPLAY"&&
    technical?.scope==="LV01_LV02_LV03_ONLY"&&
    technical?.engine_owner==="web/core.mjs"&&
    technical?.catalog_owner==="web/levels/catalog.mjs"&&
    technical?.implemented_level_ids?.join(",")==="LV-01,LV-02,LV-03"&&
    technical?.design_only_level_ids?.join(",")==="LV-04,LV-05,LV-06"&&
    technical?.physical_source_mutant_count===6&&
    technical?.world_geometry_no_duplication===true&&
    technical?.gameplay_change_intended===false&&
    technical?.browser_executed_in_source_contract===false&&
    technical?.creative_a0_approval===false&&
    technical?.author_review==="BLOCKED_EXTERNAL"&&
    technical?.future_entity_state_generalization==="NOT_IMPLEMENTED"&&
    technical?.beta_authorized===false&&
    technical?.code_oracles?.join(",")==="tests/catalog.test.mjs,tests/catalog-mutation.test.mjs");
  const implemented=["LV-01","LV-02","LV-03"],proposed=["LV-04","LV-05","LV-06"];
  fail("s03-catalog-runtime",IMPLEMENTED_LEVEL_IDS.join(",")===implemented.join(",")&&
    DESIGN_ONLY_LEVEL_IDS.join(",")===proposed.join(",")&&
    describeLevel("LV-01",CFG,PLATFORMS).width===CFG.width&&
    describeLevel("LV-01",CFG,PLATFORMS).platforms===PLATFORMS&&
    describeLevel("LV-02",CFG,PLATFORMS,23).platforms.at(-1).x===
      lv02Surfaces(23).at(-1).x&&
    describeLevel("LV-03",CFG,PLATFORMS).width===LV03.width);
  const s3Ids=["T3_00","T3_01","T3_02","T3_03","T3_04","T3_05"];
  fail("s03-catalog-gate",nodes.get("G_WORLD_CATALOG_S03")?.kind==="AND"&&
    nodes.get("G_WORLD_CATALOG_S03")?.depends_on?.join(",")===s3Ids.join(",")&&
    nodes.get("G_WORLD_CATALOG_S03")?.authorization==="NONE"&&
    nodes.get("G_WORLD_CATALOG_S03")?.baseline_status==="BLOCKED"&&
    s3Ids.every((id,i)=>nodes.get(id)?.kind==="LEAF"&&
      nodes.get(id)?.witness===null&&
      nodes.get(id)?.baseline_status===(i===5?"BLOCKED_EXTERNAL":"NOT_VERIFIED"))&&
    nodes.get("G_CREATIVE_A0_S02")?.baseline_status==="BLOCKED"&&
    contract?.next_a0?.approval?.human_approved===false);
  const entity3=contract?.technical_s03b;
  fail("s03b-entity-contract",entity3?.schema==="nilo.engineering-s03b-action-entities/1"&&
    entity3?.id==="S03b-NILO-NEXT"&&
    entity3?.status==="SOURCE_IMPLEMENTATION_CANDIDATE_NOT_AUTHOR_ACCEPTED"&&
    entity3?.scope==="LV01_ACTION_ENTITIES_ONLY"&&
    entity3?.source_owner==="web/action.mjs"&&
    entity3?.consumer_owner==="web/core.mjs"&&
    entity3?.blueprint_export==="LV01_ENTITY_BLUEPRINT"&&
    entity3?.validation_export==="validateActionBlueprint"&&
    entity3?.spawn_export==="spawnActionEntities"&&
    entity3?.no_new_levels===true&&entity3?.same_runtime_shape===true&&
    entity3?.independent_mutable_instances===true&&
    entity3?.unique_entity_ids===true&&
    entity3?.source_mutation_oracle==="tests/entity-blueprint-mutation.test.mjs"&&
    entity3?.positive_oracle==="tests/entity-blueprint.test.mjs"&&
    entity3?.physical_source_mutants===7&&
    entity3?.browser_regression==="tests/browser-action.py"&&
    entity3?.external_author_approval==="BLOCKED_EXTERNAL"&&
    entity3?.creative_decisions==="PENDING_AUTHOR_DECISION"&&
    entity3?.beta_authorized===false);
  const blue=LV01_ENTITY_BLUEPRINT,spawned=spawnActionEntities("LV-01");
  fail("s03b-entity-source",validateActionBlueprint(blue)===true&&
    Object.isFrozen(blue)&&Object.isFrozen(blue.enemies)&&
    Object.isFrozen(blue.pickups)&&
    blue.enemies?.length===2&&blue.pickups?.length===3&&
    blue.enemies?.every(Object.isFrozen)&&blue.pickups?.every(Object.isFrozen)&&
    spawned?.enemies?.length===2&&spawned.pickups?.length===3&&
    spawned.enemies[0]!==blue.enemies[0]&&spawned.pickups[0]!==blue.pickups[0]&&
    spawnActionEntities("LV-02")===null&&spawnActionEntities("LV-04")===null);
  const s3bLeaves=["E3_00","E3_01","E3_02","E3_03","E3_04","E3_05"];
  fail("s03b-action-gate",nodes.get("G_ACTION_ENTITIES_S03B")?.kind==="AND"&&
    nodes.get("G_ACTION_ENTITIES_S03B")?.depends_on?.join(",")===s3bLeaves.join(",")&&
    nodes.get("G_ACTION_ENTITIES_S03B")?.authorization==="NONE"&&
    nodes.get("G_ACTION_ENTITIES_S03B")?.baseline_status==="BLOCKED"&&
    s3bLeaves.every((id,i)=>nodes.get(id)?.kind==="LEAF"&&
      nodes.get(id)?.witness===null&&
      nodes.get(id)?.baseline_status===(i===5?"BLOCKED_EXTERNAL":"NOT_VERIFIED"))&&
    contract?.next_a0?.approval?.human_approved===false);
  const gm=contract?.golden_minute_v0;
  fail("g1v0-visual-contract",gm?.schema==="nilo.golden-minute-v0/1"&&
    gm?.id==="G1-V0"&&
    gm?.status==="TECHNICAL_VISUAL_CANDIDATE_NOT_AUTHOR_APPROVED"&&
    gm?.scope==="LV01_OPENING_X_0_TO_750_WITH_SMOOTH_FADE"&&
    gm?.source_owner==="web/golden-minute.mjs"&&
    gm?.consumer_owner==="web/main.mjs"&&
    gm?.visual_mode_default==="GOLDEN_MINUTE_CANDIDATE"&&
    gm?.legacy_fallback==="?visual=legacy"&&
    gm?.native_resolution?.join(",")==="960,540"&&
    gm?.legacy_internal_resolution?.join(",")==="480,270"&&
    gm?.detail_is_native===true&&gm?.rendering_only===true&&
    gm?.physics_changed===false&&gm?.checkpoint_codec_changed===false&&
    gm?.telemetry_added===false&&
    gm?.compared_browser_test==="tests/browser-golden.py"&&
    gm?.source_test==="tests/golden-minute.test.mjs"&&
    gm?.source_mutation_test==="tests/golden-minute-mutation.test.mjs"&&
    gm?.physical_visual_mutants===8&&gm?.physical_browser_mutants===1&&
    gm?.independent_novice_acceptance==="BLOCKED_EXTERNAL"&&
    gm?.author_art_approval==="BLOCKED_EXTERNAL"&&
    gm?.original_asset_provenance==="FIRST_PARTY_PROCEDURAL_SOURCE_CANDIDATE"&&
    gm?.rights_review==="BLOCKED_EXTERNAL"&&
    gm?.release_authorized===false&&gm?.beta_authorized===false);
  const g0={level:"LV-01",x:48,y:418,camera:0,ticks:0};
  fail("g1v0-native-source",GOLDEN_MINUTE?.schema==="nilo.golden-minute-candidate/1"&&
    GOLDEN_MINUTE?.width===960&&GOLDEN_MINUTE?.height===540&&
    GOLDEN_MINUTE?.detailStep===1&&
    GOLDEN_MINUTE?.authorApproved===false&&GOLDEN_MINUTE?.playerAccepted===false&&
    goldenMinutePlan(g0)?.opacity===1&&
    goldenMinutePlan({...g0,x:650})?.opacity===.5&&
    goldenMinutePlan({...g0,x:750})===null&&
    goldenMinutePlan({...g0,level:"LV-02"})===null&&
    goldenMinutePlan(g0,true)===null);
  const gIds=["V0_00","V0_01","V0_02","V0_03","V0_04","V0_05"];
  fail("g1v0-AND-gate",nodes.get("G_GOLDEN_MINUTE_V0")?.kind==="AND"&&
    nodes.get("G_GOLDEN_MINUTE_V0")?.depends_on?.join(",")===gIds.join(",")&&
    nodes.get("G_GOLDEN_MINUTE_V0")?.baseline_status==="BLOCKED"&&
    nodes.get("G_GOLDEN_MINUTE_V0")?.authorization==="NONE"&&
    gIds.every((id,i)=>nodes.get(id)?.kind==="LEAF"&&
      nodes.get(id)?.witness===null&&
      nodes.get(id)?.baseline_status===(i===5?"BLOCKED_EXTERNAL":"NOT_VERIFIED"))&&
    contract?.next_a0?.approval?.human_approved===false&&
    nodes.get("Q07")?.baseline_status==="BLOCKED_EXTERNAL");
  const motion=contract?.golden_motion_v1;
  fail("g1v1-animation-contract",motion?.schema==="nilo.golden-motion-v1/1"&&
    motion?.id==="G1-V1"&&
    motion?.status==="SOURCE_IMPLEMENTATION_CANDIDATE_NOT_CREATIVE_APPROVAL"&&
    motion?.scope==="LV01_GOLDEN_MINUTE_X_0_750_ONLY"&&
    motion?.source_owner==="web/golden-minute.mjs"&&
    motion?.consumer_owner==="web/main.mjs"&&
    motion?.contract_export==="GOLDEN_MOTION"&&
    motion?.pose_selector==="goldenMotionPose"&&
    motion?.gameplay_poses?.join(",")==="IDLE,RUN,AIR,FIRE,HURT"&&
    motion?.actual_shot_required_for_flare===true&&
    motion?.actual_invulnerability_required_for_hurt===true&&
    motion?.simulation_mutated===false&&motion?.storage_mutated===false&&
    motion?.external_assets_added===false&&
    motion?.legacy_visual_fallback==="?visual=legacy"&&
    motion?.source_test==="tests/golden-motion.test.mjs"&&
    motion?.physical_source_mutation_test==="tests/golden-motion-mutation.test.mjs"&&
    motion?.native_browser_test==="tests/browser-golden-motion.py"&&
    motion?.physical_source_mutants===9&&
    motion?.prior_visual_browser==="tests/browser-golden.py"&&
    motion?.author_art_approval==="BLOCKED_EXTERNAL"&&
    motion?.independent_player_validation==="BLOCKED_EXTERNAL"&&
    motion?.rights_review==="BLOCKED_EXTERNAL"&&
    motion?.a0_draft_only===true&&motion?.beta_authorized===false&&
    motion?.release_authorized===false);
  const initialMotion={level:"LV-01",x:48,y:418,ticks:0,vx:0,onGround:true,
    action:{invulnerable:0,shots:[],facing:1}};
  fail("g1v1-source-pose",GOLDEN_MOTION?.schema==="nilo.golden-motion/1"&&
    GOLDEN_MOTION?.renderOnly===true&&GOLDEN_MOTION?.authorApproved===false&&
    GOLDEN_MOTION?.independentPlaytest===false&&
    Object.isFrozen(GOLDEN_MOTION)&&
    goldenMotionPose(initialMotion)?.phase==="IDLE"&&
    goldenMotionPose({...initialMotion,vx:200,ticks:5})?.stride===3&&
    goldenMotionPose({...initialMotion,onGround:false})?.phase==="AIR"&&
    goldenMotionPose({...initialMotion,action:{...initialMotion.action,shots:[{x:70,y:410}]}})?.phase==="FIRE"&&
    goldenMotionPose({...initialMotion,action:{...initialMotion.action,invulnerable:4}})?.phase==="HURT"&&
    goldenMotionPose({...initialMotion,level:"LV-02"})===null);
  const gMotion=["V1_00","V1_01","V1_02","V1_03","V1_04","V1_05"];
  fail("g1v1-motion-gate",nodes.get("G_GOLDEN_MOTION_V1")?.kind==="AND"&&
    nodes.get("G_GOLDEN_MOTION_V1")?.depends_on?.join(",")==
      ["G_GOLDEN_MINUTE_V0",...gMotion].join(",")&&
    nodes.get("G_GOLDEN_MOTION_V1")?.baseline_status==="BLOCKED"&&
    nodes.get("G_GOLDEN_MOTION_V1")?.authorization==="NONE"&&
    gMotion.every((id,i)=>nodes.get(id)?.kind==="LEAF"&&
      nodes.get(id)?.witness===null&&
      nodes.get(id)?.baseline_status===(i===5?"BLOCKED_EXTERNAL":"NOT_VERIFIED"))&&
    contract?.next_a0?.approval?.human_approved===false&&
    nodes.get("Q07")?.baseline_status==="BLOCKED_EXTERNAL");
  fail("lv03-no-self-approved-gates",["L3_00","L3_01","L3_02","L3_03","L3_04","L3_05","L3_06","L3_07","L3_08"].every(id=>
    nodes.get(id)?.baseline_status==="NOT_VERIFIED"&&nodes.get(id)?.witness===null)&&
    nodes.get("G_LV03_PR12")?.authorization==="NONE");
  const delivery=contract?.delivery;
  fail("delivery-source-truth",delivery?.id==="I07-D"&&
   delivery?.codespaces?.port===8000&&delivery?.codespaces?.host==="0.0.0.0"&&
   delivery?.codespaces?.command==="npm start"&&delivery?.codespaces?.visibility==="private"&&
   delivery?.codespaces?.user_forwarded_connection==="NOT_OBSERVED"&&
   delivery?.render?.kind==="STATIC_SITE"&&delivery?.render?.publish_dir==="dist"&&
   delivery?.render?.deploy_trigger==="checksPass"&&
   delivery?.render?.remote_deployment==="BLOCKED_EXTERNAL"&&
   delivery?.render?.live_origin==="NOT_CONFIGURED"&&
   delivery?.release_authorized===false&&delivery?.beta_authorized===false);
  fail("delivery-no-external-laundering",["DL02","DL08"].every(id=>
    nodes.get(id)?.baseline_status==="BLOCKED_EXTERNAL"&&nodes.get(id)?.witness===null));
  const experience=nodes.get("Q07");
  fail("dod-experience-quality",experience?.kind==="LEAF"&&experience?.baseline_status==="BLOCKED_EXTERNAL"&&
    experience?.witness===null&&experience?.noncompensatory_subcriteria?.join(",")==="character-identity,platform-affordance,jump-and-retry-feel,visual-hud-readability,narrative-comprehension,audio-or-author-approved-muted-scope,observed-independent-player-acceptance");
  const visit=new Set(),stack=new Set(),reachable=new Set();
  const walk=id=>{if(stack.has(id)){errors.push("dod-cycle");return;}if(visit.has(id))return;
    const n=nodes.get(id);if(!n){errors.push("dod-dangling:"+id);return;}
    stack.add(id);reachable.add(id);
    for(const d of n.depends_on||[])walk(d);
    stack.delete(id);visit.add(id);
  };
  walk(dod?.root);fail("dod-unreachable",reachable.size===ids.length);
  fail("dod-no-false-pass",Array.from(nodes.values()).every(n=>n.baseline_status!=="PASS"&&n.authorization!=="APPROVED"));
  const layers=chain?.layers||[],lid=layers.map(x=>x.id);
  fail("semantic-chain",chain?.schema==="nilo.semantic-provenance-chain/1"&&layers.length===15&&distinct(lid));
  fail("semantic-edges",(chain?.links||[]).length>=16&&
    chain.links.every(x=>lid.includes(x.from)&&lid.includes(x.to)&&x.relation));
  fail("honest-sha",layers.every(x=>x.sha256===null));
  fail("physical-boundary",layers.find(x=>x.id==="L13")?.state==="UNOBSERVED"&&
    layers.find(x=>x.id==="L14")?.state==="REFERENCES_ONLY");
  fail("normative-register",refs?.schema==="nilo.normative-register/1"&&refs?.references?.length===7&&
    distinct(refs.references.map(x=>x.id))&&refs.references.every(x=>x.uri?.startsWith("https://")&&x.text_sha256===null&&x.conformance&&!/CERTIFIED|COMPLIANT/.test(x.conformance)));
  fail("law-honesty",refs?.references?.find(x=>x.id==="LAW-EAA")?.applicability==="REVIEW_REQUIRED");
  fail("bom-design-only",bom?.bomFormat==="CycloneDX"&&bom?.specVersion==="1.7"&&
    bom?.metadata?.lifecycles?.[0]?.phase==="design"&&bom.compositions?.[0]?.aggregate==="incomplete"&&
    bom.components?.length===0);
  fail("no-packages",pkg?.private===true&&pkg?.license==="UNLICENSED"&&
    !pkg.dependencies&&!pkg.devDependencies&&!pkg.optionalDependencies);
  // Inspect source boundaries: no false full-game claim and no remote dependencies.
  const html=readFileSync(resolve(ROOT,"web/index.html"),"utf8");
  const main=readFileSync(resolve(ROOT,"web/main.mjs"),"utf8");
  fail("runtime-controls-and-states",contract?.gameplay?.game_state?.join(",")==="PLAYING,PAUSED,DEFEATED,COMPLETED"&&
    contract?.gameplay?.design_only_states?.join(",")==="TITLE,FALLEN"&&
    contract?.gameplay?.input?.repair?.join(",")==="KeyE"&&
    contract?.gameplay?.input?.next_level?.join(",")==="KeyN"&&
    main.includes("e.code==='KeyE'")&&main.includes('e.code==="KeyN"')&&
    readFileSync(resolve(ROOT,"web/core.mjs"),"utf8").includes("'DEFEATED'"));
  fail("no-network",html.includes("connect-src 'none'")&&!/https?:\/\/|fetch\s*\(/.test(main));
  for(const p of ["web/core.mjs","web/main.mjs","web/index.html","docs/PRODUCT_CONTRACT.md","docs/PROVENANCE.md"])
    fail("missing-source:"+p,existsSync(resolve(ROOT,p)));
  errors.push(...validateBridge({bridge,contract,dod},ROOT));
  errors.push(...validateIterationHypothesis(dod));
  return [...new Set(errors)].sort();
}
export function verify() {
  const errors=audit(load());
  return {schema:"nilo.seed-verification/1",source_status:errors.length?"FAIL":"PASS_SCOPED_SOURCE",
    game_status:"BLOCKED_EXTERNAL",full_contract:"NOT_DEMONSTRATED",
    author_approval:"NOT_OBSERVED",release_authorized:false,authority:"NONE",errors};
}
const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){const result=verify();console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=2;}
