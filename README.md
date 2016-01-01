#Pirate map generator

This was done as part of the monthly challenge over on https://www.reddit.com/r/proceduralgeneration/comments/3vcbb3/monthly_challenge_1_dec_2015_procedural_pirate_map/



Try it out on: http://drake7707.github.io/piratemap/

If you want to use a custom seed, add ?seed=your_number as querystring, for example http://drake7707.github.io/piratemap/?seed=77077707


Note: this is a typescript project so you might want to look at piratemap.ts and not piratemap.js which is the output from the compiler. While still readable it's probably a lot better readable in typescript.

I created the entire thing with the typescript editor (https://github.com/drake7707/Typescript-Editor), which is why everything is in a single file.

I already had the poisson disc sampling, cellular automata and diamond square lying around (though I needed to convert them to typescript) so most of my time was spent on the actual treasure map algorithm.
