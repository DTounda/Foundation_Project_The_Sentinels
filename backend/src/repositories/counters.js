/**
 * Mongo creates text ids (_id). The API uses numbers (medicineId: 1, userId: 2...),
 * so each collection gets its next number from the "counters" collection.
 */
async function nextId(db, name) {
  const counter = await db
    .collection('counters')
    .findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );
  return counter.seq;
}

/**
 * Reserve `count` consecutive ids in ONE query.
 * Returns an array like [41, 42, 43] for count = 3.
 */
async function nextIds(db, name, count) {
  if (count <= 0) return [];

  const counter = await db
    .collection('counters')
    .findOneAndUpdate(
      { _id: name },
      { $inc: { seq: count } },
      { upsert: true, returnDocument: 'after' },
    );

  const last = counter.seq;
  return Array.from({ length: count }, (_, i) => last - count + 1 + i);
}

module.exports = { nextId, nextIds };
