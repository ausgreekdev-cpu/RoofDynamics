import { parseProjectCsv } from './csv'

describe('parseProjectCsv', () => {
  it('parses valid rows with normalized headers', () => {
    const result = parseProjectCsv(
      'name,customerName,address,suburb,state,postcode,planArea,pitchDegrees,coastalZone\n' +
      'Fremantle Re-roof,James Wilson,12 Beach St,Fremantle,WA,6160,180,22,true'
    )
    expect(result.errors).toHaveLength(0)
    expect(result.rows).toHaveLength(1)
    expect(result.rows[0]).toMatchObject({
      name: 'Fremantle Re-roof',
      customerName: 'James Wilson',
      suburb: 'Fremantle',
      state: 'WA',
      coastalZone: true,
      planArea: 180,
      pitchDegrees: 22,
    })
  })

  it('reports rows missing required fields', () => {
    const result = parseProjectCsv('name,customerName\nOnly Name,')
    expect(result.rows).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toContain('customername')
  })

  it('defaults state and status when blank', () => {
    const result = parseProjectCsv('name,customerName,state,status\nTest,Customer,,')
    expect(result.rows[0].state).toBe('WA')
    expect(result.rows[0].status).toBe('NEW')
  })

  it('coerces numeric fields', () => {
    const result = parseProjectCsv('name,customerName,planArea,pitchDegrees\nTest,Customer,220,25')
    expect(result.rows[0].planArea).toBe(220)
    expect(result.rows[0].pitchDegrees).toBe(25)
  })

  it('handles CRLF and quoted fields', () => {
    const result = parseProjectCsv('name,customerName,notes\r\n"Test, Roof","Jane Doe","Has, comma"\r\n')
    expect(result.rows[0].name).toBe('Test, Roof')
    expect(result.rows[0].notes).toBe('Has, comma')
  })

  it('returns row numbers for errors', () => {
    const result = parseProjectCsv('name,customerName\nValid,Person\n,Bad')
    expect(result.errors[0].row).toBe(3)
  })
})
