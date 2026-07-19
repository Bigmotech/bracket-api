const express = require('express');
const cors = require('cors');

const { BracketsManager } = require('brackets-manager');
const { JsonDatabase } = require('brackets-json-db');

const app = express();

app.use(cors());
app.use(express.json());

const storage = new JsonDatabase();
const manager = new BracketsManager(storage);
app.get('/', (req,res)=>{
    console.log("I got new code")
    res.send("This is something new")
})

app.post('/api/create', async (req, res) => {
    try {
        const { name, tournamentId, type, seeding, settings } = req.body;

        await manager.create.stage({
            tournamentId: tournamentId,
            name: name,
            type: type,
            seeding: seeding,
            settings: settings,
        });


        res.json(`Create ${name} with ID ${tournamentId}`);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message,
        });
    }
});

app.get('/api/bracket/:id', async (req, res) => {
    try {

        const id = Number.parseInt(req.params.id);
        await manager.get.currentStage(id).then(async value => {
            let data = await manager.get.stageData(value.id)
            res.json(data)

        })
        // const data = await manager.get.stageData(0)
        // res.json(data);
    } catch (err) {
        res.status(500).json({
            error: err.message,
        });
    }
});

app.put('/api/update', async (req, res)=>{
    const { id, group, round, matchNumber, team1, team2 } = req.body;
    console.log("Something so new it has to pack up")
    console.log(id);
    let groupOffset = Number.parseInt(group) - 1;
    let roundOffset = round - 1;
    let stage = await manager.get.currentStage(id);
    let values = await manager.get.stageData(stage.id);
    console.log(stage)
    
    let winnerBracketOffset = values.round.filter(round => round.group_id == 0).length
    console.log(winnerBracketOffset)
    if(group > 0)
        roundOffset += winnerBracketOffset
    console.log(roundOffset)
    let data = (await manager.get.stageData(stage.id)).match.find(match => {
        return match.group_id == groupOffset && match.number == matchNumber && match.round_id == roundOffset

    })
    console.log(data);
    manager.update.match({

        id: data.id,
        opponent1: { result: team1>team2 ? 'win' : 'loss'},
        opponent2: { result: team2>team1 ? 'win' : 'loss'}
    })
    res.send("Update");
})

app.post('/api/clear', async (req,res)=>{
    await storage.reset();
    res.json('OK')

})
// 2. The Catch-All 404 Middleware (Must be down here)
app.use((req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// 3. Your global error handler (Optional, but best practice)
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

app.listen(process.env.PORT, () => {
    console.log('Bracket server running on port 3001');
});
