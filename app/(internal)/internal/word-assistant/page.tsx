"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function WordAssistantPage() {
    const [inputText, setInputText] = React.useState("")
    const [outputText, setOutputText] = React.useState("")
    const [tone, setTone] = React.useState("professional")

    const handleSummarize = () => {
        setOutputText(`This is a summary of the text: "${inputText.substring(0, 50)}..."`);
    }

    const handleCheckGrammar = () => {
        setOutputText("Grammar and spelling are correct.");
    }

    const handleChangeTone = () => {
        setOutputText(`The text has been changed to a ${tone} tone.`);
    }

    const handleGenerate = () => {
        setOutputText("Here is some generated text based on your input.");
    }

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-2xl font-bold">Word Assistant</h1>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <Label htmlFor="input-text" className="text-lg font-semibold">Your Text</Label>
                    <Textarea
                        id="input-text"
                        placeholder="Enter your text here..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="min-h-[400px] mt-2"
                    />
                </div>
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assistant Tools</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex space-x-2">
                                <Button onClick={handleSummarize}>Summarize</Button>
                                <Button onClick={handleCheckGrammar}>Check Grammar</Button>
                                <Button onClick={handleGenerate}>Generate</Button>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="tone-select">Tone:</Label>
                                <Select onValueChange={setTone} defaultValue={tone}>
                                    <SelectTrigger id="tone-select" className="w-[180px]">
                                        <SelectValue placeholder="Select a tone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="casual">Casual</SelectItem>
                                        <SelectItem value="formal">Formal</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleChangeTone} variant="outline">Change Tone</Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Separator />
                    <Card>
                        <CardHeader>
                            <CardTitle>Result</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="min-h-[200px] p-4 bg-muted rounded-md">
                                {outputText}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
