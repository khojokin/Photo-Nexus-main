import pg from "/home/runner/workspace/node_modules/.pnpm/pg@8.20.0/node_modules/pg/lib/index.js";
const { Client } = pg;

const c = new Client({ connectionString: process.env.DATABASE_URL });
await c.connect();

const photographers = [
  "Elena Vasquez",
  "Kenji Watanabe",
  "Amara Diallo",
  "Sofia Andersen",
  "Marcus Chen",
  "Priya Sharma",
  "Ingrid Bjornsson",
  "Lorenzo Ricci",
  "Yuki Tanaka",
  "Nathalie Dupont",
];

// --- MESSAGES ---
// Clear existing messages
await c.query("TRUNCATE messages RESTART IDENTITY CASCADE");

// Each conversation is [sender, recipient, content, minutesAgo]
// We'll build realistic back-and-forth threads between many pairs

const conversations = [
  // Elena <-> Kenji
  [
    ["Elena Vasquez", "Kenji Watanabe", "Kenji, your Kyoto series is absolutely breathtaking. The way you captured the quiet in those early morning streets — I could feel the stillness.", 14400],
    ["Kenji Watanabe", "Elena Vasquez", "Thank you Elena, that means a lot coming from you. I woke up at 4am for three days straight to get that light. Your golden hour Alps shot is the reason I started shooting landscapes seriously.", 14380],
    ["Elena Vasquez", "Kenji Watanabe", "Ha! I remember that shoot — I nearly froze solid. What lens were you using for the Senbon Torii? The compression on those gates is incredible.", 14360],
    ["Kenji Watanabe", "Elena Vasquez", "Sony 70-200 GM at 200mm, f/4. The compression really sells the infinite illusion. I was pressed against a wall trying to stay out of frame. Are you shooting the Dolomites this autumn?", 14340],
    ["Elena Vasquez", "Kenji Watanabe", "Planning to, yes — last two weeks of October when the larch trees go gold. You should come. The light there at 5am is honestly otherworldly.", 14320],
    ["Kenji Watanabe", "Elena Vasquez", "October in the Dolomites sounds like a dream. Let me check my schedule — I have Tokyo Fashion Week commitments but after that I'm free.", 14300],
    ["Elena Vasquez", "Kenji Watanabe", "Perfect. I'll share my accommodation contact. The rifugio I stay at is tiny but the views from the terrace at dawn are worth any discomfort.", 14280],
  ],
  // Ingrid <-> Marcus
  [
    ["Ingrid Bjornsson", "Marcus Chen", "Marcus — just saw your salmon run series. The underwater perspective at that angle must have been an absolute nightmare to set up. Tell me everything.", 7200],
    ["Marcus Chen", "Ingrid Bjornsson", "Ingrid! Ha, 'nightmare' is an understatement. Waterproof housing, two weeks of permit applications, and I sat in a glacial river for four hours a day. Completely worth it.", 7180],
    ["Ingrid Bjornsson", "Marcus Chen", "What housing are you using? I've been wanting to do some work in Iceland's glacial rivers but I've been nervous about the cold affecting my A7RV.", 7160],
    ["Marcus Chen", "Ingrid Bjornsson", "Aquatech Blimps housing — totally solid down to freezing temps. The trick is keeping your battery pack inside your drysuit close to your body. Saved my shots on day one.", 7140],
    ["Ingrid Bjornsson", "Marcus Chen", "That's a brilliant tip. I was going to try a cheaper alternative but I think I'll invest in proper kit. Your 'The Watcher' shot of that eagle — licensed yet?", 7120],
    ["Marcus Chen", "Ingrid Bjornsson", "Nature Canada approached me last week actually! Still in negotiation. That shot took three months of returning to the same perch daily until the eagle trusted me enough to stay.", 7100],
    ["Ingrid Bjornsson", "Marcus Chen", "Three months — that's the kind of patience I admire. My aurora work is similar. You can't force it, you just have to be there, ready, every single night.", 7080],
    ["Marcus Chen", "Ingrid Bjornsson", "Exactly. Your Aurora Curtain image — is that a single exposure or composite? The detail in both the stars and the foreground is exceptional.", 7060],
    ["Ingrid Bjornsson", "Marcus Chen", "Single exposure, believe it or not. Sony A7SIII at ISO 12800 for 8 seconds. The moon was behind a thin cloud layer which diffused everything perfectly. Pure luck meets preparation.", 7040],
  ],
  // Lorenzo <-> Nathalie
  [
    ["Lorenzo Ricci", "Nathalie Dupont", "Nathalie, the Marrakech Morning photo — the way the light cuts through that narrow medina alley is something else. I've tried to shoot Morocco three times and never got anything close to that.", 5400],
    ["Nathalie Dupont", "Lorenzo Ricci", "Lorenzo! Thank you. The secret is being there at 6:15am specifically — any later and the sun angle changes completely. And I had a local guide who knew exactly which alley faces east.", 5380],
    ["Lorenzo Ricci", "Nathalie Dupont", "A local guide makes all the difference. When I shot the Colosseum I had a contact at the Soprintendenza who let me in an hour before public access — completely changed what was possible.", 5360],
    ["Nathalie Dupont", "Lorenzo Ricci", "The Colosseum at First Light — I've been staring at that image for weeks. The warm stone against the blue hour sky is extraordinary. What time does that blue hour actually start there?", 5340],
    ["Lorenzo Ricci", "Nathalie Dupont", "In September, about 40 minutes before sunrise. I was there at 4:30am, set up by 5, and had about 12 minutes of that perfect transition light. I shot 340 frames in those 12 minutes.", 5320],
    ["Nathalie Dupont", "Lorenzo Ricci", "340 frames! I do the same — high volume in the magic moments. By the way, I'm heading to Florence next month. Any recommendations for undiscovered spots?", 5300],
    ["Lorenzo Ricci", "Nathalie Dupont", "The Piazzale Michelangelo lookout is famous but most people don't know there's a higher terrace behind the church that gives you an even better angle. I'll send you the coordinates.", 5280],
    ["Nathalie Dupont", "Lorenzo Ricci", "That would be incredible, thank you. I'll return the favour with my Santorini location notes — I found a cliffside spot that tourists almost never reach.", 5260],
    ["Lorenzo Ricci", "Nathalie Dupont", "Deal. Your Santorini at Dusk is one of the most shared images on this platform for good reason. That terracotta against the Aegean at golden hour — it's almost unfairly beautiful.", 5240],
    ["Nathalie Dupont", "Lorenzo Ricci", "Ha — I'll take 'unfairly beautiful'. It took four trips to Santorini before the weather cooperated. Fourth time lucky, as they say.", 5220],
  ],
  // Priya <-> Amara
  [
    ["Priya Sharma", "Amara Diallo", "Amara — the aerial geometry shots of the salt flats are unlike anything I've seen. Are those done with a drone or a plane charter?", 3600],
    ["Amara Diallo", "Priya Sharma", "Hi Priya! Drone for the lower altitude work, but the salt flat mirror shot was from a chartered Cessna at about 800 feet. The drone couldn't get the perspective I needed.", 3580],
    ["Priya Sharma", "Amara Diallo", "A Cessna! That's a serious commitment. Your composition sense is extraordinary — the geometry in Desert Geometry especially. How do you visualise these shots before you're in the air?", 3560],
    ["Amara Diallo", "Priya Sharma", "Google Earth obsessively, then satellite imagery, then I sketch compositions on paper before I go. By the time I'm in the air I have 6-8 specific shots in mind and I execute them quickly.", 3540],
    ["Priya Sharma", "Amara Diallo", "I love that systematic approach. I tend to be more intuitive — your Holi shot is the perfect example of finding geometry in chaos. Did you have a specific position planned or was it discovered in the moment?", 3500],
    ["Amara Diallo", "Priya Sharma", "Entirely in the moment! I was elevated on a van roof and the powder cloud opened up for about 3 seconds. Pure instinct. Your Monsoon Reflections though — that looks completely planned.", 3480],
    ["Priya Sharma", "Amara Diallo", "Yes — I scouted that puddle for two days before the monsoon arrived. I knew exactly the right time of day for the reflection angle. The rickshaw was luck though — he stopped right on my mark.", 3460],
    ["Amara Diallo", "Priya Sharma", "Patience meeting opportunity. That's the whole game isn't it. By the way, I'm planning a Namibia trip in July — I think the Sossusvlei dunes at first light could be extraordinary.", 3440],
    ["Priya Sharma", "Amara Diallo", "Namibia is on my list too! The ochre of those dunes at golden hour must be incredible. Let me know if you want a second shooter — I've been wanting to do a collaborative series.", 3420],
  ],
  // Yuki <-> Sofia
  [
    ["Yuki Tanaka", "Sofia Andersen", "Sofia, your White on White shot — the technical precision is staggering. How are you metering in a scene that's almost entirely white?", 2400],
    ["Sofia Andersen", "Yuki Tanaka", "Yuki! Great question. I expose to the right as much as I dare — the histogram almost off the right edge — and then pull back in Lightroom. The texture only survives if you don't underexpose.", 2380],
    ["Yuki Tanaka", "Sofia Andersen", "ETTR in an all-white scene, I've always been nervous about that. Your Frost Geometry macro inspired me enormously — the ice crystal lattice structure looks almost architectural.", 2360],
    ["Sofia Andersen", "Yuki Tanaka", "Coming from you that's incredibly kind. Your macro work is in another league. What magnification are you working at for the pollen architecture series?", 2340],
    ["Yuki Tanaka", "Sofia Andersen", "Up to 5:1 with extension tubes and a MPE-65mm. At that scale depth of field is maybe 0.1mm so I focus stack 40-80 frames and blend in Helicon Focus.", 2320],
    ["Sofia Andersen", "Yuki Tanaka", "40-80 frames per image — the patience required! I struggle with 3-frame HDR brackets. Do you have a motorised rail for the focus stacking?", 2300],
    ["Yuki Tanaka", "Sofia Andersen", "Yes, a Really Right Stuff motorised macro rail with 0.01mm increments. The setup takes an hour per shot but the results are worth it. Your Nordic Fog — is that shot from a kayak?", 2280],
    ["Sofia Andersen", "Yuki Tanaka", "It is! A sea kayak off the Faroe Islands coast. I had the camera on a floating platform I designed myself. The waves were maybe 30cm but it felt like a lot at the time.", 2260],
  ],
  // Elena <-> Nathalie
  [
    ["Nathalie Dupont", "Elena Vasquez", "Elena — your Pyrenean Gold shot is genuinely one of the best landscape images I've seen this year. The layer of fog in the valley below the meadow is just perfect.", 1800],
    ["Elena Vasquez", "Nathalie Dupont", "Nathalie, thank you so much! That took three consecutive mornings camping at altitude. The fog was a surprise — I'd planned the shot for the peak colour but the fog made it something else entirely.", 1780],
    ["Nathalie Dupont", "Elena Vasquez", "Happy accidents are the best ones. Your instinct to shoot it anyway instead of waiting for 'better' conditions shows real maturity. Are you on any editorial contracts this year?", 1760],
    ["Elena Vasquez", "Nathalie Dupont", "Geo France and a new one with an outdoor brand — mostly for their digital channels. Nothing print yet but I'm hoping the Alps series gets there. How about you?", 1740],
    ["Nathalie Dupont", "Elena Vasquez", "I just signed with a travel magazine for six issues — they want a 'Mediterranean through the seasons' feature. It's good work but the deadlines are tight.", 1720],
    ["Elena Vasquez", "Nathalie Dupont", "Mediterranean through the seasons — what a brief! Summer light in Greece, autumn in Tuscany, winter in Morocco… that's a dream assignment honestly.", 1700],
    ["Nathalie Dupont", "Elena Vasquez", "It really is. I'm most excited about the winter Andalucía leg — shooting after rare snowfall on the white villages. If it ever snows. Climate is so unpredictable now.", 1680],
  ],
  // Marcus <-> Amara
  [
    ["Marcus Chen", "Amara Diallo", "Amara — I've been trying to break into aerial work. The Terracotta Village overhead shot — did you need special permissions for that in West Africa?", 900],
    ["Amara Diallo", "Marcus Chen", "Marcus, yes — permits for drone work vary enormously by country. Mali required an application 30 days in advance through the civil aviation authority. Well worth it though.", 880],
    ["Marcus Chen", "Amara Diallo", "30 days advance — I'll factor that in. Is there a fixer you'd recommend for West Africa? I'm planning a broad coastal documentary project.", 860],
    ["Amara Diallo", "Marcus Chen", "I work with a producer based in Dakar who is incredible — multilingual, knows every permit office, and has great editorial sense. I'll send you her contact. Your Forest Light shot though — that's extraordinary lens flare control.", 840],
    ["Marcus Chen", "Amara Diallo", "Ha — that 'controlled' flare was entirely accidental! I was shooting into the sun at f/16 and that starburst appeared. I almost deleted it thinking it was a mistake.", 820],
    ["Amara Diallo", "Marcus Chen", "The best shots always have some element of accident. You recognised its value though — that's the skill. Is the forest series ongoing or is it wrapped?", 800],
    ["Marcus Chen", "Amara Diallo", "Ongoing — I want to return in winter for the snow and blue hour light through bare trees. Completely different mood. Will share when it's done.", 780],
  ],
  // Kenji <-> Lorenzo
  [
    ["Kenji Watanabe", "Lorenzo Ricci", "Lorenzo — your Baroque Shadow Play shot looks like a Caravaggio painting. I keep coming back to it. Is that a single natural light source through a church window?", 600],
    ["Lorenzo Ricci", "Kenji Watanabe", "Kenji, exactly — a single high window in a small church in Lecce, about 11am when the sun is at the right angle to create that single hard shaft. No reflectors, nothing added.", 580],
    ["Kenji Watanabe", "Lorenzo Ricci", "Incredible. The art historical references in your work are so considered. Do you study painting deliberately as visual research or is it more instinctive?", 560],
    ["Lorenzo Ricci", "Kenji Watanabe", "Very deliberate. I spend time in museums whenever I travel, specifically looking at light direction and shadow quality in old master paintings. Vermeer for diffuse north light, Caravaggio for hard shadow drama.", 540],
    ["Kenji Watanabe", "Lorenzo Ricci", "That's a fascinating practice. I do something similar but with Japanese woodblock prints — Hiroshige's flat graphic approach influences how I think about negative space in street work.", 520],
    ["Lorenzo Ricci", "Kenji Watanabe", "Hiroshige! I can see that in the Senbon Torii image — the flattening of the repeated forms. Cross-cultural visual research is so underrated as a practice.", 500],
    ["Kenji Watanabe", "Lorenzo Ricci", "Exactly. We should do a joint series sometime — Japanese minimalism meets Italian baroque. I can't tell if it would be harmonious or completely chaotic.", 480],
    ["Lorenzo Ricci", "Kenji Watanabe", "Probably both, which is exactly why it would be interesting. I'm in Tokyo in spring for a commission — let's make it happen.", 460],
  ],
  // Sofia <-> Ingrid
  [
    ["Sofia Andersen", "Ingrid Bjornsson", "Ingrid — how do you manage the loneliness of the long-exposure night shoots? I tried aurora chasing in Finland last winter and by hour three alone in a field at -18°C I was losing my mind.", 300],
    ["Ingrid Bjornsson", "Sofia Andersen", "Ha! Honestly — podcasts and thermos coffee. And I've come to think of the solitude as part of the work. The loneliness is in the photos. The Icelandic Horizon shot only exists because I was alone enough to be fully present.", 280],
    ["Sofia Andersen", "Ingrid Bjornsson", "That's a beautiful way to think about it. The loneliness is in the photos. Your Glacier Edge image has that quality — a solitary figure against geological time. Is that someone you hired or a friend?", 260],
    ["Ingrid Bjornsson", "Sofia Andersen", "My partner. He's been my model on every iceland trip — he knows exactly how to stand still for a 30-second exposure without breathing too visibly. A rare skill.", 240],
    ["Sofia Andersen", "Ingrid Bjornsson", "A long-exposure-tolerant partner is the ideal collaborator! My partner refuses to stand in the cold for more than 90 seconds. I've learned to work fast. Your White on White comment — have you tried shooting snow scenes in flat light?", 220],
    ["Ingrid Bjornsson", "Sofia Andersen", "Flat light snow is incredibly hard — you lose all texture. I use a circular polariser to enhance the subtle shadows in the snow crystals. It recovers detail that's otherwise invisible. Worth trying.", 200],
    ["Sofia Andersen", "Ingrid Bjornsson", "I've never tried a polariser for snow — that's a revelation. I always assumed they were only for skies and water. Adding it to my kit immediately.", 180],
  ],
  // Priya <-> Yuki
  [
    ["Priya Sharma", "Yuki Tanaka", "Yuki, I've been experimenting with macro lately after your work inspired me. Any advice for a total beginner? I keep getting motion blur even on a tripod.", 120],
    ["Yuki Tanaka", "Priya Sharma", "Priya! Motion blur at macro scale comes from air currents and vibration more than camera shake. Try a black cloth backdrop to block drafts, and use a 2-second self-timer or cable release. Mirror lockup helps too.", 100],
    ["Priya Sharma", "Yuki Tanaka", "Air currents! I never would have thought of that. I've been blaming my tripod. What magnification do you suggest starting at?", 80],
    ["Yuki Tanaka", "Priya Sharma", "Start at 1:1 with a dedicated macro lens — the Canon 100mm L or Sony FE 90mm are both excellent. Get comfortable with focus stacking at that scale before going higher. 2:1 and above is a whole other challenge.", 60],
    ["Priya Sharma", "Yuki Tanaka", "The Sony 90mm is on my radar. Your Rain on Glass comment — it's actually sort of macro, isn't it? The bokeh circles filling the frame like that.", 40],
    ["Yuki Tanaka", "Priya Sharma", "Exactly! Rain on glass is wonderful macro practice — the subject stays still (mostly) and the round bokeh behind teaches you how focal length and aperture interact at close focus distances. You've clearly already got the instinct for it.", 20],
    ["Priya Sharma", "Yuki Tanaka", "That's so kind, thank you. I'll keep experimenting. Your Pollen Architecture honestly changed how I look at the world — I now see photographic potential in things I used to walk past completely.", 10],
  ],
];

// Insert all messages
let msgCount = 0;
for (const thread of conversations) {
  for (const [sender, recipient, content, minsAgo] of thread) {
    const ts = new Date(Date.now() - minsAgo * 60 * 1000);
    const read = minsAgo > 60; // older messages are read
    await c.query(
      "INSERT INTO messages (sender_name, recipient_name, content, read, created_at) VALUES ($1,$2,$3,$4,$5)",
      [sender, recipient, content, read, ts]
    );
    msgCount++;
  }
}
console.log(`Inserted ${msgCount} messages across ${conversations.length} conversations`);

// --- COMMENTS ---
// Delete existing comments and re-seed with many more
await c.query("TRUNCATE comments RESTART IDENTITY CASCADE");

const comments = [
  // Photo 1 - Golden Hour in the Alps (Elena Vasquez)
  [1, "Kenji Watanabe", "That layer of cloud below the peaks is everything. I've been chasing that exact shot for two years.", 14400],
  [1, "Ingrid Bjornsson", "The colour temperature here is perfectly balanced. You kept warmth in the sky without blowing the highlights on the snow. Technically impeccable.", 12000],
  [1, "Lorenzo Ricci", "The mist in the valley below the ridge line is what makes it. Without that, it's a beautiful landscape. With it, it's a painting.", 9600],
  [1, "Nathalie Dupont", "I keep coming back to this one. The silence in the image is palpable — you can almost hear the stillness above the cloud line.", 8400],
  [1, "Marcus Chen", "F-stop and shutter speed on this? The snow retains texture without washing out which is incredibly hard to achieve at golden hour.", 7200],
  [1, "Priya Sharma", "The foreground rocks anchor it so well. A common mistake would be to crop them out and lose the sense of depth entirely.", 4800],
  [1, "Sofia Andersen", "I've studied this image probably fifty times. The graduated density of the cloud is almost too perfect — if I didn't know better I'd think it was composited.", 3600],
  [1, "Yuki Tanaka", "Nature truly is the greatest artist. This reminds me of ink wash painting — the tonal gradations feel almost brushed rather than captured.", 2400],
  [1, "Amara Diallo", "The way the sunset light catches just the upper third of the snow and leaves the rest in cool shadow — that's observation and timing working together beautifully.", 1200],

  // Photo 2 - The Lone Pine (Elena Vasquez)
  [2, "Sofia Andersen", "Lone subject, infinite context. The simplicity is devastating — every element earns its place in the frame.", 13200],
  [2, "Kenji Watanabe", "Japanese aesthetics call this 'ma' — the meaningful emptiness. You've captured it without knowing the tradition perhaps. Extraordinary.", 11000],
  [2, "Amara Diallo", "The sky-to-ground ratio and the placement of the tree — slightly off-centre, not perfectly rule-of-thirds — feels completely natural and considered at the same time.", 8800],
  [2, "Lorenzo Ricci", "Monochrome potential in this is enormous. Would be curious to see it converted — but honestly the muted autumn colour palette works as its own kind of near-mono.", 6600],
  [2, "Nathalie Dupont", "The texture of the hillside grass in the foreground has a quality almost like velvet. What time of year was this?", 4400],
  [2, "Priya Sharma", "The solitude this conveys is moving. I think about this image when I'm struggling with over-complicated compositions.", 2200],
  [2, "Ingrid Bjornsson", "Perfect light. Not golden hour, not blue hour — that precise window of diffuse warm afternoon light that photographers chase for years.", 800],

  // Photo 3 - Coastal Mist (Elena Vasquez)
  [3, "Marcus Chen", "The sea mist rendering here is extraordinary. You can feel the temperature drop and the salt air. That's not just visual information, it's sensory.", 14000],
  [3, "Yuki Tanaka", "Long exposure? The water surface has that silky quality that only comes with a multi-second shutter at low ISO. Perfect execution.", 11500],
  [3, "Priya Sharma", "The rocks in the foreground have a wet-slick quality I can almost feel. Texture is the unsung hero of coastal photography and you've mastered it.", 9000],
  [3, "Amara Diallo", "The tonal range from the dark foreground boulders to the hazy horizon is remarkable. Nothing is crushed black, nothing is blown. The dynamic range control is masterful.", 6500],
  [3, "Nathalie Dupont", "This image breathes. Not many landscape photos genuinely do that — most just sit there. This one inhales and exhales.", 3200],
  [3, "Ingrid Bjornsson", "Reminds me of the Faroe Islands in winter — that particular grey that isn't sad, just honest. Beautiful work Elena.", 1100],

  // Photo 4 - Pyrenean Gold (Elena Vasquez)
  [4, "Nathalie Dupont", "The gold of that meadow against the grey rock and the blue sky — I feel like I'm looking at a Flemish landscape painting. Absolutely exceptional.", 15600],
  [4, "Kenji Watanabe", "The scale is almost deceptive. I looked at it for a minute before I realised how large the mountain behind must be. That reveals itself slowly. Wonderful.", 12000],
  [4, "Lorenzo Ricci", "The cloud layer in the valley below is the critical element. Without it this is a strong landscape. With it, the depth becomes infinite.", 9000],
  [4, "Sofia Andersen", "The wildflowers in the foreground — are those gentians? The tiny detail that rewards you for looking closely. Love that.", 6000],
  [4, "Marcus Chen", "The colour harmony between the gold foreground, the neutral rock, and the cool sky is perfect. Three temperature zones, completely balanced.", 3000],
  [4, "Priya Sharma", "I want to walk into this photograph. That's the highest compliment I know how to give a landscape image.", 900],

  // Photo 5 - Quiet Streets of Kyoto (Kenji Watanabe)
  [5, "Elena Vasquez", "The architectural compression on that street — repeated verticals, the vanishing point — it's like a lesson in geometry. Absolutely masterful.", 16000],
  [5, "Lorenzo Ricci", "The human figure in the middle distance provides perfect scale without dominating. That kind of foreground/background balance is very hard to achieve in urban work.", 13000],
  [5, "Nathalie Dupont", "I've been to Kyoto four times and never managed to find this light. You've captured something I've chased for years. What time of morning exactly?", 10000],
  [5, "Priya Sharma", "The texture of the cobblestones wet from the night's rain — you can smell the city. This image has a quality that goes beyond photography into pure atmosphere.", 7500],
  [5, "Sofia Andersen", "The stillness here is profound. Kyoto must be extraordinary at this hour. Do you typically work alone or with an assistant?", 5000],
  [5, "Amara Diallo", "The receding planes here — foreground wet stones, mid-ground figures, background lanterns — each layer perfectly defined. This is architecture photography by a landscape eye.", 2500],
  [5, "Ingrid Bjornsson", "I'm used to landscapes of physical scale — mountains and oceans. This shows scale of time and tradition instead. Remarkable shift in dimension.", 800],

  // Photo 6 - Black & White Tokyo (Kenji Watanabe)
  [6, "Marcus Chen", "The grain is film or digital simulation? Either way it's perfect — enhances rather than distracts, like it emerged from the scene rather than being added.", 14000],
  [6, "Ingrid Bjornsson", "Monochrome in the rain — the wet reflections multiply every light source and create a second city below the visible one. You've photographed both simultaneously.", 11000],
  [6, "Priya Sharma", "The contrast between the sharp signage and the motion-blurred pedestrians is wonderful. Everyone racing somewhere, and nobody staying.", 8500],
  [6, "Lorenzo Ricci", "Cartier-Bresson's decisive moment. The umbrella angles, the shadows, the reflected neon — it all resolves in a single precise second. You were ready.", 6000],
  [6, "Yuki Tanaka", "The tiny detail of the reflected light in the rain puddle at the bottom right rewards careful looking. It's like finding a secret in the image.", 3500],
  [6, "Elena Vasquez", "This is everything I want to achieve with street work. The patience required to wait for all these elements to align simultaneously must be enormous.", 1200],

  // Photo 7 - Rainy Season (Kenji Watanabe)
  [7, "Sofia Andersen", "The colour palette — muted greens, fog grey, the single red umbrella — is so carefully restrained it feels like it was designed. Was it, or purely observed?", 13000],
  [7, "Amara Diallo", "The single red element against the near-monochrome environment is a classic device, but used with such subtlety here that it doesn't feel like a device at all.", 10500],
  [7, "Priya Sharma", "As someone who grew up with monsoon season, this resonates deeply. Rainy season has a particular quality of interiority and quietness you've captured perfectly.", 8000],
  [7, "Ingrid Bjornsson", "The fog compresses the background beautifully. Everything past 20 metres just dissolves. In landscape this would be frustrating; here it's the whole point.", 5500],
  [7, "Nathalie Dupont", "I've visited Japan in rainy season specifically for this light. The overcast sky becomes a giant softbox — soft, directionless light that's incredibly flattering to architectural surfaces.", 3000],
  [7, "Marcus Chen", "The reflections in the wet street surface are doing enormous compositional work here — connecting foreground to background, extending the image downward.", 900],

  // Photo 8 - Senbon Torii (Kenji Watanabe)
  [8, "Elena Vasquez", "The infinity illusion is complete. My eye keeps trying to find the end of the gates and keeps failing. This is one of the most hypnotic images on this platform.", 17000],
  [8, "Lorenzo Ricci", "Telephoto compression used with real purpose here. Every gate the same size, collapsing distance — it questions the nature of perspective itself.", 14000],
  [8, "Nathalie Dupont", "I've photographed Fushimi Inari a dozen times. Never with this perspective and this light. What position on the mountain is this? I need to go back.", 11000],
  [8, "Amara Diallo", "The geometry is almost otherworldly. The repeated form in warm vermilion against the dark background — this could hang in a contemporary art gallery without adjustment.", 8000],
  [8, "Sofia Andersen", "The slight haze in the deeper background actually enhances the infinity illusion. As the gates recede they become less distinct, suggesting they continue indefinitely.", 5000],
  [8, "Yuki Tanaka", "As a Japanese photographer this image moves me. These gates are part of my cultural memory and to see them through your lens — both familiar and entirely new — is profound.", 2000],
  [8, "Ingrid Bjornsson", "The warm orange-red against the dark green of the trees is a colour pairing I've never thought to use. I'll be studying this for a long time.", 500],

  // Photo 9 - Desert Geometry (Amara Diallo)
  [9, "Elena Vasquez", "The overhead perspective turns natural landscape into abstract art. Those ridge patterns look like brushstrokes. I can't believe this is unmanipulated.", 16000],
  [9, "Kenji Watanabe", "The shadow play at this altitude and angle is extraordinary. Each dune ridge throws a shadow that defines the next one — shadow creating form, form creating shadow.", 13000],
  [9, "Sofia Andersen", "Aerial photography demands such different compositional instincts — no horizon line, no foreground, no leading lines in the traditional sense. You've worked out a completely new visual language.", 10000],
  [9, "Marcus Chen", "What drone or aircraft? The resolution at this altitude is remarkable — you can count individual plants in the inter-dune corridors.", 7500],
  [9, "Ingrid Bjornsson", "The colour palette here — ochre, burnt sienna, cream — is something I want to use in a studio context. Nature's colour choices are always bolder than anything we'd design.", 5000],
  [9, "Lorenzo Ricci", "The negative space of the shadow areas is doing half the compositional work. You've photographed light and shadow as equal subjects. Brilliant.", 2500],
  [9, "Yuki Tanaka", "This image shares something with Japanese rock garden design — the raking of gravel into ridged patterns to suggest water and waves. Whether intentional or observed, the parallel is remarkable.", 800],

  // Photo 10 - Salt Flats Mirror (Amara Diallo)
  [10, "Priya Sharma", "The reflection is so perfect that I initially couldn't determine which was sky and which was ground. The disorientation is the experience. Extraordinary work.", 15000],
  [10, "Kenji Watanabe", "The colour temperature shift between sky and reflection — the sky warmer, the surface reflection cooler — reveals that they aren't the same. A photograph teaching you to look more carefully. Brilliant.", 12000],
  [10, "Elena Vasquez", "The single dark figure at the edge grounds the entire image and provides the only indication of scale. Without them, this would be pure abstraction.", 9500],
  [10, "Sofia Andersen", "My immediate thought was Magritte. The reality and its reflection as equally valid but subtly different truths. This has genuine conceptual depth beyond the visual beauty.", 7000],
  [10, "Marcus Chen", "The technical execution for this kind of work is so demanding — exposure for both sky and reflection simultaneously, eliminating wind ripple. How many attempts before this frame?", 4500],
  [10, "Ingrid Bjornsson", "The pre-dawn light quality here — that transitional moment between night and day — gives the sky a luminosity that wouldn't exist an hour later. Perfect timing.", 2000],
  [10, "Lorenzo Ricci", "Salt flat photography is its own discipline and this is the finest example I've seen. The stillness required — in the environment and in the photographer — is immense.", 400],

  // Photo 11 - The Terracotta Village (Amara Diallo)
  [11, "Nathalie Dupont", "The overhead compression makes the village look like a living organism — cells and structures breathing together. I've never seen human settlement look so organic from above.", 14500],
  [11, "Lorenzo Ricci", "The colour harmony across the terracotta rooftops and ochre walls is extraordinary. To a Western European eye this reads as almost monochromatic — warm and earthy throughout.", 11500],
  [11, "Kenji Watanabe", "The shadow directions tell me this was midday sun at a low latitude — straight down, short shadows. Most photographers avoid midday light. You've used it as the whole point.", 9000],
  [11, "Sofia Andersen", "The human scale — you can see people going about daily life, tiny figures — against the geological scale of the surrounding landscape is what gives this image its resonance.", 6500],
  [11, "Marcus Chen", "The aerial perspective here is so pure — no foreground distortion, no wide-angle drama, just truthful compression. It reads like a map that's also a poem.", 4000],
  [11, "Ingrid Bjornsson", "The long shadows of the walls creating geometric patterns across the ground — I could study this image for hours and keep finding new compositional elements.", 1500],

  // Photo 12 - Ocean Solitude (Sofia Andersen)
  [12, "Ingrid Bjornsson", "The colour here — that particular Nordic blue-green of cold Atlantic water — is one I've been trying to photograph for years. You've rendered it with extraordinary fidelity.", 14000],
  [12, "Kenji Watanabe", "The minimalism is almost aggressive. Sky, sea, nothing else. The courage to commit to this much negative space and trust it to carry the image is admirable.", 11000],
  [12, "Marcus Chen", "The tonal separation between the sky gradient and the water gradient is so subtle. Two blues that are distinct but barely — you must have worked very precisely in post.", 8000],
  [12, "Elena Vasquez", "The loneliness this image projects is genuine rather than performed. You were truly alone out there and it shows in every pixel. Raw and beautiful.", 5500],
  [12, "Amara Diallo", "I usually work with strong compositional elements — subjects, geometry, scale. This image teaches me that profound emptiness is also a subject. Thank you for this.", 3000],
  [12, "Priya Sharma", "The water texture in the foreground — those small waves — is the only indication of scale and movement. Without it, this would float free of time entirely. Brilliant choice to include it.", 800],

  // Photo 13 - Nordic Fog (Sofia Andersen)
  [13, "Ingrid Bjornsson", "The Faroe Islands in this light are like nowhere else on earth. You've captured the particular quality of that low-latitude overcast light perfectly.", 12000],
  [13, "Kenji Watanabe", "The cliff face emerging from the fog — present and absent simultaneously — is extraordinary. You've photographed uncertainty itself.", 9500],
  [13, "Marcus Chen", "Shooting from a kayak in these conditions must have been challenging. The image is perfectly sharp which tells me your shutter speed was high. What ISO were you running?", 7000],
  [13, "Lorenzo Ricci", "The vertical drama of these cliffs against the horizontal fog layer — two fundamental forces in tension. This image has genuine structural intelligence.", 4500],
  [13, "Nathalie Dupont", "The muted colour palette — grey, grey-green, grey-white — is so precisely right for this subject. Any more colour and you'd lose the essential mood entirely.", 2000],

  // Photo 14 - White on White (Sofia Andersen)
  [14, "Yuki Tanaka", "The tonal precision here is extraordinary. To render white within white with this much detail and no loss of luminosity — this is as technically accomplished as photography gets.", 13500],
  [14, "Ingrid Bjornsson", "The Scandinavian design tradition of working with white as a complex subject rather than an absence of colour is perfectly expressed here. This is genuinely culturally specific work.", 10500],
  [14, "Elena Vasquez", "I've been studying this trying to understand the lighting. It must be a north-facing window with very diffuse winter light — the shadows are impossibly soft.", 7500],
  [14, "Kenji Watanabe", "In Japanese aesthetics, white is not empty but full — full of potential, full of quiet. This image understands that. Deeply beautiful.", 5000],
  [14, "Amara Diallo", "As someone who works with strong colour and geometry this image is almost shocking in its restraint. The discipline required — to resist adding any element — is real craft.", 2500],
  [14, "Marcus Chen", "The texture of the fabric folds — the way they create subtle shadow valleys — is doing all the work here. Texture as the sole compositional element. Remarkable.", 600],

  // Photo 15 - Forest Light (Marcus Chen)
  [15, "Elena Vasquez", "The cathedral quality of this forest light — the vertical shafts of light like columns — is breathtaking. You've found the architecture within nature.", 14000],
  [15, "Kenji Watanabe", "The particle-laden air that makes those light shafts visible is the key element. Without it, you have beautiful forest. With it, you have something transcendent.", 11000],
  [15, "Ingrid Bjornsson", "The colour of that light — warm amber coming through cool green — creates a temperature contrast that's almost visible as sound. I mean that seriously.", 8500],
  [15, "Amara Diallo", "The scale established by the ferns in the foreground against the massive trees is so important. Without that foreground reference this loses its sense of monumentality.", 6000],
  [15, "Yuki Tanaka", "Forests are some of the most challenging subjects because there's no horizon, no sky reference, and complexity in every direction. You've brought complete order from it.", 3500],
  [15, "Nathalie Dupont", "The starburst from the light source entering frame — at exactly the right intensity, neither too weak nor overwhelming — is perfectly controlled. Technical and intuitive together.", 1000],

  // Photo 16 - Aerial Coastline (Marcus Chen)
  [16, "Amara Diallo", "The graphic quality of this from altitude is extraordinary — the turquoise water, the white foam edge, the dark rock — it reads as pure abstraction.", 12000],
  [16, "Sofia Andersen", "The palette of this is something I could live inside. Turquoise, white, charcoal, and the thin line of surf foam separating water from land — perfect.", 9000],
  [16, "Elena Vasquez", "The texture of the water at this altitude is incredible — you can see individual wave structures creating a pattern that disappears at lower altitude. Truly unique perspective.", 6500],
  [16, "Lorenzo Ricci", "The composition is beautifully diagonal — the coastline cuts from bottom-left to top-right, giving the image momentum and direction. This doesn't just sit there, it moves.", 4000],
  [16, "Nathalie Dupont", "The clarity of the water at different depths — darker channels, lighter shallows — reads as a map of the underwater topography. Science and art simultaneously.", 1800],

  // Photo 17 - The Watcher (Marcus Chen)
  [17, "Ingrid Bjornsson", "The eye contact — if you can call it that — between the eagle and the viewer is extraordinary. This bird has assessed the situation and decided you're not a threat. Three months well spent.", 13000],
  [17, "Yuki Tanaka", "The sharpness of the eye against the slightly soft feather detail creates a hierarchy — the eye is the photograph, the rest is context. Perfect focus placement.", 10500],
  [17, "Elena Vasquez", "The background bokeh is so beautifully rendered — warm, circular, completely non-distracting. The eagle is isolated in the frame with no competition whatsoever.", 8000],
  [17, "Amara Diallo", "Wildlife photography requires a kind of patience that landscape photographers understand but that few others do. You can feel the months of waiting in this image.", 5500],
  [17, "Nathalie Dupont", "The dignity and intelligence in that gaze is humbling. This bird has been watching these mountains for years. The photograph acknowledges that.", 2800],
  [17, "Kenji Watanabe", "In Japanese art, birds of prey are symbols of precision and focus. This photograph is precisely that — a focused act of photography documenting a focused act of vision.", 600],

  // Photo 18 - Salmon Run (Marcus Chen)
  [18, "Ingrid Bjornsson", "The underwater perspective changes everything — most salmon run photography is from above or the bank. You've entered their world. This is what makes the image.", 11500],
  [18, "Priya Sharma", "The water rendering here — the particulate matter, the light refracting — is extraordinary. I can feel the cold of glacial water looking at this.", 9000],
  [18, "Yuki Tanaka", "The silver-pink of the salmon against the river gravel — the colours are beautiful in a completely unexpected way. Nature's palette is always braver than anything we'd design.", 6500],
  [18, "Sofia Andersen", "The motion blur on some salmon against the sharp rendering of others creates a beautifully layered sense of time — some frozen, some streaming past.", 4000],
  [18, "Elena Vasquez", "The scale — the salmon filling the frame from edge to edge, dozens of them — conveys the abundance in a way no wide shot could match. Getting close was the right decision.", 1500],

  // Photo 19 - Rain on Glass (Priya Sharma)
  [19, "Kenji Watanabe", "The bokeh circles through rain-covered glass is a technique I've seen done badly a hundred times. You've done it better than I've ever seen it done well. The restraint in the colour palette is key.", 15000],
  [19, "Yuki Tanaka", "This is halfway between macro photography and documentary. The technical execution — keeping some drops sharp while others are pure bokeh — requires very precise depth of field control.", 12000],
  [19, "Sofia Andersen", "The warm and cool tones through the water drops are beautiful — each droplet is a tiny lens creating its own world. This idea could be an entire series.", 9500],
  [19, "Marcus Chen", "The city visible (barely) beyond the glass — warm lights, blurred movement — provides the perfect complement to the cold precision of the droplets in focus. Perfect pairing.", 7000],
  [19, "Elena Vasquez", "The moodiness here is extraordinary. Rain photography is so hard to make original and you've completely made it your own. The emotional register is perfectly calibrated.", 4500],
  [19, "Ingrid Bjornsson", "The compression of distance this creates — the droplets millimetres away, the city kilometres away — occupies the same visual plane. That's a profound spatial idea executed beautifully.", 1800],

  // Photo 20 - Monsoon Reflections (Priya Sharma)
  [20, "Amara Diallo", "The reflected city in the puddle inverted — the actual city above cooler, the reflection below warmer from the artificial lights — is such a beautiful detail to notice and preserve.", 14000],
  [20, "Kenji Watanabe", "Street photography at its finest — observation, patience, and the courage to sit with a camera at ground level looking at a puddle until the right moment arrives. Decisive.", 11000],
  [20, "Marcus Chen", "The compositional decision to include the rim of the puddle — establishing it as a found mirror rather than a digital composite — is crucial. That grounding detail makes everything credible.", 8500],
  [20, "Elena Vasquez", "The motion-blurred figure and the sharp reflection — the real world blurring, the reflected world staying still — is a lovely philosophical reversal.", 6000],
  [20, "Sofia Andersen", "I think about this image a lot when I'm struggling with 'ordinary' subjects. You found genuine beauty in a wet Mumbai street. That's the real skill.", 3500],
  [20, "Lorenzo Ricci", "Italian cities in the rain have this quality too — everything doubled, everything uncertain, the boundary between real and reflection ambiguous. You've captured something universal.", 1000],

  // Photo 21 - Holi (Priya Sharma)
  [21, "Elena Vasquez", "The explosion of colour in the upper third against the muted lower third is such a bold compositional choice. Most Holi photographers try to fill the whole frame with colour. Your restraint is striking.", 16000],
  [21, "Amara Diallo", "The powder cloud mid-explosion — frozen perfectly by a fast shutter — has a painterly quality. Each colour remains distinct even in collision. Extraordinary timing.", 13000],
  [21, "Marcus Chen", "The faces in the lower section — visible through the settling powder — grounded in joy. The human element beneath the spectacle is what separates documentation from art.", 10000],
  [21, "Kenji Watanabe", "Cultural events like this are so difficult to photograph without cliché. You've found a fresh angle — the cloud as primary subject, the celebration below as context. Completely original.", 7500],
  [21, "Lorenzo Ricci", "The colour relationships here are like a Rothko canvas — adjacent fields of pure hue interacting with each other. The fact that it's documentary makes it no less formally beautiful.", 5000],
  [21, "Nathalie Dupont", "I've wanted to attend Holi for years specifically to photograph it. This image is both inspiring and intimidating — would anything I shot come close to this? Probably not.", 2200],
  [21, "Sofia Andersen", "The movement and stillness simultaneously — some powder mid-flight sharp, some trailing as blur — creates a temporal complexity that makes the image genuinely hard to read at first. Brilliant.", 700],

  // Photo 22 - Icelandic Horizon (Ingrid Bjornsson)
  [22, "Elena Vasquez", "The quality of light here — that particular golden quality in Iceland at midnight in summer — is unlike any light I've experienced. You've captured its essential character.", 14500],
  [22, "Marcus Chen", "The vast scale of that sky relative to the minimal foreground is so bold. A 90/10 sky-to-ground ratio and it works because the cloud structure is magnificent enough to earn it.", 11500],
  [22, "Sofia Andersen", "As a Scandinavian photographer I feel the seasonal extremes deeply. The Icelandic midnight sun has a different quality than the Swedish variety — harder, more elemental. You've got it.", 9000],
  [22, "Kenji Watanabe", "The horizon line here is perfectly placed — not quite centred, just slightly below, creating space for the sky to do its work. A small decision with major consequences.", 6500],
  [22, "Amara Diallo", "The cloud formation — stratified layers, each lit differently — gives this image enormous depth. You're looking through multiple weather layers simultaneously.", 4000],
  [22, "Priya Sharma", "The colour of that sky — ice blue lightening to gold at the horizon — is something I've never seen in India. Your geography gives you access to a specific light palette I can only visit briefly.", 1500],

  // Photo 23 - Aurora Curtain (Ingrid Bjornsson)
  [23, "Elena Vasquez", "The green-purple transition in the aurora here is colour I didn't know photography could capture. Every aurora photo I've seen before this looks like a flat pale green wash. This is dimensional.", 17000],
  [23, "Marcus Chen", "If this is a single exposure the camera performance is staggering. The star detail and the foreground snow texture simultaneously — what body were you shooting?", 14000],
  [23, "Kenji Watanabe", "The vertical columns of the aurora mirror the tree silhouettes below in a way that feels intentional. Nature and coincidence creating compositional geometry.", 11000],
  [23, "Sofia Andersen", "I've been aurora chasing three times and never got anything approaching this. The curtain structure — the waves of light mid-dance — is perfectly frozen. Your timing is extraordinary.", 8000],
  [23, "Amara Diallo", "As someone who has spent most of my life in West Africa where there's no aurora, looking at this image is genuinely otherworldly. Thank you for bringing this to us.", 5500],
  [23, "Lorenzo Ricci", "The Baroque tradition of chiaroscuro — extreme light against extreme dark — exists here in the most natural form possible. You've photographed what painters have only gestured at.", 3000],
  [23, "Priya Sharma", "The colour here — the electric green bleeding into magenta — looks almost synthetic. Nature being braver than any designer would dare to be. Incredible.", 900],

  // Photo 24 - Glacier Edge (Ingrid Bjornsson)
  [24, "Marcus Chen", "The figure at the glacier edge provides the scale reference that makes the immensity comprehensible. Without them, the ice would just be abstract texture.", 12000],
  [24, "Sofia Andersen", "The blue of glacial ice is unlike any other blue in nature — it comes from the compression of centuries of snow into crystal. You've rendered it with total fidelity.", 9500],
  [24, "Elena Vasquez", "The crevasse detail in the foreground — the depth, the shadow, the ice wall — is extraordinary. This image has genuine danger in it.", 7000],
  [24, "Kenji Watanabe", "The emptiness beyond the glacier edge — pure sky, nothing but horizon — creates a cliff-like vertigo in the viewer. The scale of geological time is in this image.", 4500],
  [24, "Amara Diallo", "Climate anxiety aside, the physical beauty of this glacier is something I feel deeply grateful you've recorded. These places won't exist for long. This image is important.", 2000],
  [24, "Priya Sharma", "The temperature I feel looking at this is physical. The blue, the white, the scale — I'm cold just looking. That sensory transfer is the mark of truly accomplished photography.", 500],

  // Photo 25 - Terracotta Rooftops (Lorenzo Ricci)
  [25, "Nathalie Dupont", "The terracotta palette of this image could not be more Italian. The colour saturation is perfect — present but not pushed, exactly as the eye sees it on a clear Tuscan afternoon.", 13500],
  [25, "Amara Diallo", "This reads as aerial photography but it's not — you're at elevation on a hillside. The compressed perspective from a long lens does the same work. Very intelligent framing.", 10500],
  [25, "Kenji Watanabe", "The depth created by the overlapping rooftop layers is extraordinary. Each tile a slightly different terracotta, each shadow a slightly different depth of colour. A painting by accumulation.", 8000],
  [25, "Elena Vasquez", "Italy has this colour palette of warm earthy terracotta and deep ochre that is completely specific to the place. You've made an image that could only have been made there.", 5500],
  [25, "Sofia Andersen", "The chaotic geometry of medieval organic urban development — nothing straight, nothing aligned — is so different from my Nordic context of order and straight lines. Beautiful difference.", 3000],
  [25, "Marcus Chen", "The compression on these rooftops from the telephoto is so effective — you get the density of the medieval town without distortion. Long lens for architecture is an underused approach.", 800],

  // Photo 26 - Colosseum at First Light (Lorenzo Ricci)
  [26, "Kenji Watanabe", "The blue hour sky behind the warm stone is one of the great colour pairings in outdoor photography. You've timed it perfectly — any lighter and the sky flattens, any darker and the stone goes cold.", 15000],
  [26, "Elena Vasquez", "The Colosseum is one of the most photographed structures in the world and yet this feels entirely fresh. Private access before dawn clearly makes a structural difference in what's possible.", 12000],
  [26, "Nathalie Dupont", "The absence of tourists gives this image a melancholy that's actually more truthful to the structure's history than the crowded daytime version would be. Empty and monumental.", 9500],
  [26, "Amara Diallo", "The lit interior arches contrasting with the darker exterior face — the Colosseum illuminated from within like a lantern — is an extraordinary detail I've never noticed in photographs before.", 7000],
  [26, "Sofia Andersen", "Two thousand years of accumulated history in a single frame. The stone that has witnessed so much — the photograph is quiet about all of it, which is exactly right.", 4500],
  [26, "Marcus Chen", "The stability of this image at pre-dawn — no camera movement, perfect horizon, every arch aligned — speaks to excellent tripod discipline. Getting the technical right so the emotional can come through.", 1800],

  // Photo 27 - Baroque Shadow Play (Lorenzo Ricci)
  [27, "Kenji Watanabe", "I said it in my message but I'll say it publicly — this is Caravaggio with a camera. The single hard light source, the deep shadow, the revelation of form. It's a masterwork.", 14000],
  [27, "Elena Vasquez", "The relationship between the architectural detail and its shadow double — both equally detailed, one solid, one insubstantial — is a beautiful formal idea.", 11000],
  [27, "Yuki Tanaka", "Shadow photography is its own discipline. The shadow is as considered as the subject, which is rare. Most photographers treat shadow as absence. You treat it as presence.", 8500],
  [27, "Amara Diallo", "The warm stone colour against the cool deep shadow — that chromatic relationship within near-monochrome — is incredibly refined. The colour editing is as precise as the framing.", 6000],
  [27, "Sofia Andersen", "The beam of light entering the frame at that angle — cutting the composition diagonally — gives this image enormous tension and dynamism. Nothing is at rest here.", 3500],
  [27, "Nathalie Dupont", "Italian baroque architecture was designed to be lit exactly like this. The original architects knew the sun would fall at that angle. You've honoured their intention two centuries later.", 1000],

  // Photo 28 - Macro World (Yuki Tanaka)
  [28, "Sofia Andersen", "The focus stacking execution here is perfection — no halos, no ghosting, every layer seamlessly blended. How many frames in the stack?", 13000],
  [28, "Elena Vasquez", "This looks like alien architecture. The scale transformation — something a millimetre wide rendered at gallery scale — is conceptually powerful as well as technically extraordinary.", 10000],
  [28, "Priya Sharma", "I've never seen this level of detail in a macro photograph. The individual cell structures visible in the surface — this is scientific documentation that's also art. Remarkable.", 7500],
  [28, "Marcus Chen", "The lighting here — soft, directional, consistent across the stack — must have required a custom setup. No ambient light variation between frames or you'd get alignment problems.", 5000],
  [28, "Kenji Watanabe", "The patience and precision this demands is almost meditative. To work at this scale requires you to slow down to the speed of the subject. There's something Zen about that.", 2500],
  [28, "Ingrid Bjornsson", "Nature at this scale is completely foreign to my practice — I work at geological scale. Looking at your work makes me want to go the other direction entirely. Genuinely inspiring.", 600],

  // Photo 29 - Frost Geometry (Yuki Tanaka)
  [29, "Sofia Andersen", "Ice crystal photography is something I've attempted in Nordic conditions. The challenge of working with a subject that changes and melts as you breathe near it — how do you manage it?", 12000],
  [29, "Elena Vasquez", "The crystal lattice here — the branching geometry — follows mathematical rules that nature discovered long before mathematicians wrote them down. The image is a theorem.", 9500],
  [29, "Ingrid Bjornsson", "In Iceland these crystal structures form on the windscreens of cars overnight. I've photographed them but never with this clarity. What temperature was it when you made this?", 7000],
  [29, "Marcus Chen", "The backlit rendering of the ice crystals — translucent rather than reflective — gives them a quality almost like stained glass. Beautiful lighting solution for a very difficult subject.", 4500],
  [29, "Kenji Watanabe", "The branching structure of these crystals is the same as river systems seen from above, lightning caught in photographs, and the neuron networks in the brain. Same pattern at every scale. Profound subject.", 2000],
  [29, "Amara Diallo", "Coming from the heat of the Sahara, looking at your frost images feels like entering another dimension entirely. Your work makes me want to experience the cold rather than avoid it.", 500],

  // Photo 30 - Pollen Architecture (Yuki Tanaka)
  [30, "Sofia Andersen", "The spherical structure of these pollen grains photographed at this magnification is extraordinary. Most people will never know this level of complexity exists in something invisible to the naked eye.", 11500],
  [30, "Priya Sharma", "I commented to you privately about this but I'll say it publicly — this image changed how I look at the world. I look at flowers differently since seeing this.", 9000],
  [30, "Marcus Chen", "The 5:1 magnification and the colour palette — the pollen is a warm honey gold — makes this feel like the surface of another planet. Scale-shifting photography at its finest.", 6500],
  [30, "Elena Vasquez", "The smooth spheres against the rough textured surface they rest on — contrast at scales we can't perceive directly. You're revealing hidden worlds.", 4000],
  [30, "Ingrid Bjornsson", "I'm trained as a geologist and the surface texture here looks identical to certain volcanic mineral formations I've studied. Nature repeating its patterns regardless of scale.", 1800],
  [30, "Kenji Watanabe", "The Japanese principle of finding the extraordinary in the ordinary — mono no aware — is perfectly expressed here. Beauty in impermanence, in smallness, in the overlooked.", 400],

  // Photo 31 - Night Market Colours (Nathalie Dupont)
  [31, "Priya Sharma", "The colour density here — every square centimetre packed with different hues — should be overwhelming but isn't. The organisation of the frame is extraordinary. How?", 13000],
  [31, "Kenji Watanabe", "Night market photography is so often chaotic and unreadable. You've found stillness within the chaos — a single clear narrative within the colour storm.", 10500],
  [31, "Lorenzo Ricci", "The warm artificial light palette of the market against the cooler ambient night sky — that contrast is doing enormous mood work. It feels welcoming and a little wild simultaneously.", 8000],
  [31, "Elena Vasquez", "The human figures partially blurred by the long exposure — present but ghostly — give the image a timeless quality. The market has happened every night for centuries. They are everyone who ever stood there.", 5500],
  [31, "Amara Diallo", "West African night markets have this same quality — the specificity of the local culture in every detail, the universal joy of commerce and gathering. Your eye is attuned to both dimensions.", 3000],
  [31, "Sofia Andersen", "This image makes me want to travel immediately. That's the highest practical compliment a travel photograph can receive.", 800],

  // Photo 32 - Lavender Fields (Nathalie Dupont)
  [32, "Elena Vasquez", "The purple-violet gradient from full colour in the foreground to cooler lavender in the far distance — natural atmospheric perspective working perfectly with the subject. Exquisite.", 14000],
  [32, "Lorenzo Ricci", "The line of the lavender rows leading the eye toward the farmhouse is the oldest composition trick in painting and it works for exactly the same reason here — it's honest geometry.", 11000],
  [32, "Kenji Watanabe", "The compression of the lavender rows at this focal length makes the field appear infinite. This is the Senbon Torii effect applied to agriculture. The same mathematics creates the same result.", 8500],
  [32, "Sofia Andersen", "The specific quality of Provençal light — warm and golden but not harsh — is something Cézanne spent his career trying to paint. You've captured it in a photograph.", 6000],
  [32, "Ingrid Bjornsson", "The bee in the middle-right foreground — barely visible, easily missed — rewards the careful viewer. That kind of layered discovery is the mark of a really generous photographer.", 3500],
  [32, "Priya Sharma", "Purple and gold — the lavender and the wheat stubble visible between the rows — is a colour pairing I want to use in my own work. Borrowing this lesson gratefully.", 1000],

  // Photo 33 - Marrakech Morning (Nathalie Dupont)
  [33, "Lorenzo Ricci", "The shaft of light through the medina alley at this angle — the architectural consequence of narrow medieval streets facing east — is photographically specific to this hour and season.", 13500],
  [33, "Amara Diallo", "Morocco is close to my Malian roots and this image makes me deeply homesick in the most beautiful way. The quality of the morning light in the medina is something I know in my body.", 10500],
  [33, "Kenji Watanabe", "The cool shadow and the warm light exist in the same frame without either compromising the other — the exposure decision must have been agonising. You chose correctly.", 8000],
  [33, "Elena Vasquez", "The tiled floor, the geometric door, the human figure in the light shaft — every element perfectly positioned. This is a photograph that couldn't have been made a second earlier or later.", 5500],
  [33, "Ingrid Bjornsson", "The architecture as light-controlling device — the medina built to channel morning light in exactly this way — is something no Northern European city has. You've accessed a different relationship between building and sun.", 3000],
  [33, "Priya Sharma", "This is the photograph that convinced me to finally visit Morocco. The light, the geometry, the human scale — I'm going in March. Thank you for making me brave enough.", 800],

  // Photo 34 - Santorini at Dusk (Nathalie Dupont)
  [34, "Elena Vasquez", "The iconic view made entirely new by timing and placement. The warm terracotta, the Aegean blue, the golden light — you've found the definitive version of this view. I say that having seen hundreds.", 18000],
  [34, "Kenji Watanabe", "The stacked planes of white architecture stepping down to the sea — each level catching different light — creates a tonal complexity that rewards scrutiny. Every house is a slightly different white.", 15000],
  [34, "Lorenzo Ricci", "The church dome in the foreground is the perfect compositional anchor. Without it, this is a beautiful view. With it, the scale of the whole village against the Aegean becomes comprehensible.", 12000],
  [34, "Marcus Chen", "The gradient sky — deep blue at the top transitioning through gold to the warm horizon — is handled with extraordinary care. Many photographers over-saturate Santorini sunsets. You've kept it true.", 9500],
  [34, "Ingrid Bjornsson", "The Cyclades light in summer is different from anything I know — intense, direct, warm, the sea reflecting it back up from below. You've captured this specific Mediterranean quality perfectly.", 7000],
  [34, "Amara Diallo", "I've never been to Greece but this image makes me feel I understand something fundamental about the relationship between Mediterranean culture and light. Travel as photograph.", 4500],
  [34, "Sofia Andersen", "The timelessness of this image — it could have been made twenty years ago or tomorrow — is remarkable. Santorini has been this colour at this hour for millennia. The photograph participates in that continuity.", 2000],
  [34, "Priya Sharma", "This is the hero image of Affuaa and it deserves to be. I look at it every time I open the platform. It never gets less beautiful.", 500],
];

// Insert all comments
let commentCount = 0;
for (const [photoId, author, content, minsAgo] of comments) {
  const ts = new Date(Date.now() - minsAgo * 60 * 1000);
  await c.query(
    "INSERT INTO comments (photo_id, author_name, body, created_at) VALUES ($1,$2,$3,$4)",
    [photoId, author, content, ts]
  );
  commentCount++;
}

console.log(`Inserted ${commentCount} comments across all 34 photos`);
console.log("Done!");
await c.end();
